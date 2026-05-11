import React, { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import RenameModal from "./components/modals/RenameModal";
import SearchUserModal from "./components/modals/SearchUserModal";
import CreateRoomModal from "./components/modals/CreateRoomModal";
import BrowseRoomsModal from "./components/modals/BrowseRoomsModal";
import DeleteRoomModal from "./components/modals/DeleteRoomModal";
import LeaveRoomModal from "./components/modals/LeaveRoomModal";
import LoginSignupModal from "./components/modals/LoginSignupModal";

import "./App.css";

const POLL_INTERVAL_MS = 2000;

export default function App() {
  // ── Core state ─────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [activeChat, setActiveChat] = useState(null); // { type, id, name, isPrivate }
  const [myRooms, setMyRooms] = useState([]);
  const [dmPartners, setDmPartners] = useState([]);
  const [messages, setMessages] = useState([]);
  const [appReady, setAppReady] = useState(false);
  const [initError, setInitError] = useState("");

  // ── Modal state ─────────────────────────────────────────────────────────
  // One of: null | 'rename' | 'searchUser' | 'createRoom' | 'browseRooms' | 'deleteRoom' | 'leaveRoom'
  const [modal, setModal] = useState(null);
  const [deleteRoomTarget, setDeleteRoomTarget] = useState(null);
  const [leaveRoomTarget, setLeaveRoomTarget] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(!user);

  // ── Refs (avoid stale closures in setInterval) ──────────────────────────
  const activeChatRef = useRef(null);
  const userRef = useRef(null);
  const pollRef = useRef(null);
  const dmPollRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ── Initialise app on mount ─────────────────────────────────────────────
  useEffect(() => {
    initApp();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Start DM polling when app is ready ──────────────────────────────────
  useEffect(() => {
    if (!appReady || !user) return;

    async function pollDmPartners() {
      await refreshDmPartners(user.id);
    }

    pollDmPartners();
    dmPollRef.current = setInterval(pollDmPartners, POLL_INTERVAL_MS);

    return () => {
      if (dmPollRef.current) {
        clearInterval(dmPollRef.current);
        dmPollRef.current = null;
      }
    };
  }, [appReady, user?.id]);

  async function initApp() {
    // ── Guard: must run inside the Tauri webview ──────────────────────────
    // If the page is opened in a normal browser (e.g. localhost:1420 directly)
    // window.__TAURI_INTERNALS__ is undefined and every invoke() call throws
    // "TypeError: Cannot read properties of undefined (reading 'invoke')".
    if (typeof window.__TAURI_INTERNALS__ === "undefined") {
      setInitError(
        "NOT_TAURI_CONTEXT\n\n" +
          "This app must be launched through Tauri, not in a browser.\n" +
          "Run:  pnpm tauri dev",
      );
      return;
    }

    setAppReady(true);
  }

  // ── Data refreshers ─────────────────────────────────────────────────────
  async function refreshMyRooms(uid) {
    try {
      const rooms = await invoke("list_my_rooms", {
        userId: uid ?? userRef.current?.id,
      });
      setMyRooms(rooms ?? []);
    } catch (err) {
      console.error("list_my_rooms failed:", err);
    }
  }

  async function refreshDmPartners(uid) {
    try {
      const partners = await invoke("list_dm_partners", {
        userId: uid ?? userRef.current?.id,
      });
      setDmPartners(partners ?? []);
    } catch (err) {
      console.error("list_dm_partners failed:", err);
    }
  }

  // ── Message polling ──────────────────────────────────────────────────────
  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  const loadMessages = useCallback(async () => {
    const chat = activeChatRef.current;
    const u = userRef.current;
    if (!chat || !u) return;

    try {
      let msgs;
      if (chat.type === "room") {
        msgs = await invoke("list_messages_room", { roomId: chat.id });
      } else {
        msgs = await invoke("list_messages_between", {
          userA: u.id,
          userB: chat.id,
        });
      }
      setMessages(msgs ?? []);
    } catch (err) {
      console.error("loadMessages failed:", err);
    }
  }, []);

  // ── Chat selection ───────────────────────────────────────────────────────
  function openChat(chat) {
    stopPolling();
    activeChatRef.current = chat;
    setActiveChat(chat);
    setMessages([]);
    // Immediate load, then poll
    loadMessages();
    pollRef.current = setInterval(loadMessages, POLL_INTERVAL_MS);
  }

  function handleSelectDM(partner) {
    openChat({ type: "dm", id: partner.id, name: partner.name });
    // Optimistically add to DM partners sidebar if not already present
    setDmPartners((prev) =>
      prev.find((p) => p.id === partner.id) ? prev : [...prev, partner],
    );
  }

  function handleSelectRoom(room) {
    openChat({
      type: "room",
      id: room.id,
      name: room.name,
      isPrivate: room.is_private,
      ownerId: room.owner_id ?? null,
    });
  }

  // ── Sending messages ─────────────────────────────────────────────────────
  async function handleSend(content) {
    const chat = activeChat;
    const u = user;
    if (!chat || !u) return;

    try {
      if (chat.type === "room") {
        await invoke("send_message_room", {
          roomId: chat.id,
          senderId: u.id,
          content,
        });
      } else {
        await invoke("send_message_user", {
          senderId: u.id,
          recipientId: chat.id,
          content,
        });
        // Make sure the partner appears in the sidebar
        await refreshDmPartners(u.id);
      }
      await loadMessages();
    } catch (err) {
      console.error("send failed:", err);
    }
  }

  // ── Rename ───────────────────────────────────────────────────────────────
  async function handleRename(newName) {
    await invoke("rename_user", { userId: user.id, newName: newName });
    setUser((prev) => ({ ...prev, name: newName }));
  }

  // ── Room creation ────────────────────────────────────────────────────────
  async function handleCreateRoom({ name, isPrivate, code }) {
    const room = await invoke("create_room", {
      name,
      isPrivate,
      code: code ?? null,
      creatorId: user.id,
    });
    await refreshMyRooms(user.id);
    return room;
  }

  // ── Room joining ─────────────────────────────────────────────────────────
  async function handleJoinRoom(room, code) {
    await invoke("join_room", {
      userId: user.id,
      roomId: room.id,
      code: code ?? null,
    });
    await refreshMyRooms(user.id);
  }

  // ── Room deletion ──────────────────────────────────────────────────────
  async function handleDeleteRoom(room) {
    setDeleteRoomTarget(room);
    setModal("deleteRoom");
  }

  function handleLeaveRoom(room) {
    setLeaveRoomTarget(room);
    setModal("leaveRoom");
  }

  async function confirmDeleteRoom(room) {
    await invoke("delete_room", {
      roomId: room.id,
      userId: user.id,
    });

    if (
      activeChatRef.current?.type === "room" &&
      activeChatRef.current.id === room.id
    ) {
      stopPolling();
      activeChatRef.current = null;
      setActiveChat(null);
      setMessages([]);
    }

    await refreshMyRooms(user.id);
  }

  async function confirmLeaveRoom(room) {
    await invoke("leave_room", {
      roomId: room.id,
      userId: user.id,
    });

    if (
      activeChatRef.current?.type === "room" &&
      activeChatRef.current.id === room.id
    ) {
      stopPolling();
      activeChatRef.current = null;
      setActiveChat(null);
      setMessages([]);
    }

    await refreshMyRooms(user.id);
  }

  // ── Authentication ─────────────────────────────────────────────────────
  async function handleLoginSuccess(loggedInUser) {
    setUser(loggedInUser);
    userRef.current = loggedInUser;
    setShowAuthModal(false);
    await Promise.all([
      refreshMyRooms(loggedInUser.id),
      refreshDmPartners(loggedInUser.id),
    ]);
  }

  function handleLogout() {
    setUser(null);
    userRef.current = null;
    setActiveChat(null);
    setMessages([]);
    setMyRooms([]);
    setDmPartners([]);
    stopPolling();
    setShowAuthModal(true);
  }

  // ── Render guards ────────────────────────────────────────────────────────
  if (initError) {
    const isContextError = initError.startsWith("NOT_TAURI_CONTEXT");
    return (
      <div className="app-error">
        <div className="app-error-inner">
          {isContextError ? (
            <>
              <h2>🚫 Wrong Context</h2>
              <p>
                The page is open in a <strong>browser</strong>, not inside the
                Tauri window.
              </p>
              <div className="error-fix-box">
                <p className="error-fix-label">How to fix:</p>
                <pre>pnpm tauri dev</pre>
                <p className="error-fix-hint">
                  Close this browser tab and run the command above in your
                  terminal. Tauri will open its own window automatically.
                </p>
              </div>
            </>
          ) : (
            <>
              <h2>⚠️ Database Error</h2>
              <p>Could not connect to PostgreSQL.</p>
              <pre>{initError}</pre>
              <div className="error-fix-box">
                <p className="error-fix-label">Checklist:</p>
                <ul className="error-checklist">
                  <li>
                    ✅ PostgreSQL is running on <code>localhost:5432</code>
                  </li>
                  <li>
                    ✅ Database <code>chat_app_with_tauri</code> exists
                  </li>
                  <li>
                    ✅ User <code>postgres</code> / password{" "}
                    <code>admin123</code>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!appReady) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Connecting…</p>
      </div>
    );
  }

  // Show auth modal if not logged in
  if (!user) {
    return (
      <LoginSignupModal
        onLoginSuccess={handleLoginSuccess}
        onClose={() => {}} // No close option when not logged in
      />
    );
  }

  // ── Main layout ──────────────────────────────────────────────────────────
  return (
    <div className="app">
      <Sidebar
        user={user}
        myRooms={myRooms}
        dmPartners={dmPartners}
        activeChat={activeChat}
        onSelectDM={handleSelectDM}
        onSelectRoom={handleSelectRoom}
        onDeleteRoom={handleDeleteRoom}
        onLeaveRoom={handleLeaveRoom}
        onLogout={handleLogout}
        onOpenModal={setModal}
      />

      <ChatWindow
        user={user}
        activeChat={activeChat}
        messages={messages}
        onSend={handleSend}
      />

      {/* ── Modals ── */}
      {modal === "rename" && (
        <RenameModal
          currentName={user?.name}
          onRename={handleRename}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "searchUser" && (
        <SearchUserModal
          currentUserId={user?.id}
          onSelectUser={handleSelectDM}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "createRoom" && (
        <CreateRoomModal
          onCreate={handleCreateRoom}
          onClose={(room) => {
            setModal(null);
            if (room) handleSelectRoom(room);
          }}
        />
      )}

      {modal === "browseRooms" && (
        <BrowseRoomsModal
          userId={user?.id}
          onJoinRoom={handleJoinRoom}
          onOpenRoom={(room) => {
            setModal(null);
            handleSelectRoom(room);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "deleteRoom" && deleteRoomTarget && (
        <DeleteRoomModal
          room={deleteRoomTarget}
          onConfirm={() => confirmDeleteRoom(deleteRoomTarget)}
          onClose={() => {
            setModal(null);
            setDeleteRoomTarget(null);
          }}
        />
      )}

      {modal === "leaveRoom" && leaveRoomTarget && (
        <LeaveRoomModal
          room={leaveRoomTarget}
          onConfirm={() => confirmLeaveRoom(leaveRoomTarget)}
          onClose={() => {
            setModal(null);
            setLeaveRoomTarget(null);
          }}
        />
      )}
    </div>
  );
}
