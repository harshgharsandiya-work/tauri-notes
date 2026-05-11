import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Modal from "./Modal";

/**
 * BrowseRoomsModal — view all rooms, join public ones or enter code for private.
 * Props:
 *   userId      – string
 *   onJoinRoom  – (room, code: string|null) => Promise<void>
 *   onOpenRoom  – (room) => void
 *   onClose     – () => void
 */
export default function BrowseRoomsModal({
  userId,
  onJoinRoom,
  onOpenRoom,
  onClose,
}) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [showCodeFor, setShowCodeFor] = useState(null); // room.id
  const [codeInputs, setCodeInputs] = useState({}); // room.id -> string
  const [errors, setErrors] = useState({}); // room.id -> string

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    setLoading(true);
    try {
      const data = await invoke("list_all_rooms", { userId: userId });
      setRooms(data ?? []);
    } catch (err) {
      console.error("list_all_rooms failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(room) {
    if (room.is_private) {
      setShowCodeFor(room.id);
      return;
    }
    await doJoin(room, null);
  }

  async function handleJoinWithCode(room) {
    const code = (codeInputs[room.id] ?? "").trim();
    if (!code) return;
    await doJoin(room, code);
  }

  async function doJoin(room, code) {
    setJoiningId(room.id);
    setErrors((prev) => ({ ...prev, [room.id]: "" }));
    try {
      await onJoinRoom(room, code);
      setShowCodeFor(null);
      await fetchRooms(); // refresh membership status
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [room.id]: String(err) || "Failed to join.",
      }));
    } finally {
      setJoiningId(null);
    }
  }

  function setCode(roomId, value) {
    setCodeInputs((prev) => ({ ...prev, [roomId]: value }));
  }

  return (
    <Modal title="Browse Rooms" onClose={onClose} size="lg">
      {loading ? (
        <div className="modal-loading">Loading rooms…</div>
      ) : rooms.length === 0 ? (
        <div className="modal-empty">
          No rooms exist yet. Create the first one!
        </div>
      ) : (
        <div className="browse-list">
          {rooms.map((room) => (
            <div key={room.id} className="browse-item">
              {/* Info */}
              <div className="browse-item-info">
                <span className="browse-item-icon">
                  {room.is_private ? "🔒" : "#"}
                </span>
                <div>
                  <div className="browse-item-name">{room.name}</div>
                  <div className="browse-item-type">
                    {room.is_private ? "Private" : "Public"}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="browse-item-action">
                {room.is_member ? (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      onOpenRoom(room);
                      onClose();
                    }}
                  >
                    Open
                  </button>
                ) : showCodeFor === room.id ? (
                  /* Private join: inline code input */
                  <div className="inline-code-form">
                    <input
                      className="form-input form-input-sm"
                      type="text"
                      placeholder="Enter code…"
                      value={codeInputs[room.id] ?? ""}
                      onChange={(e) => setCode(room.id, e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleJoinWithCode(room)
                      }
                      autoFocus
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleJoinWithCode(room)}
                      disabled={joiningId === room.id}
                    >
                      {joiningId === room.id ? "…" : "Join"}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setShowCodeFor(null)}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleJoin(room)}
                    disabled={joiningId === room.id}
                  >
                    {joiningId === room.id ? "…" : "Join"}
                  </button>
                )}

                {errors[room.id] && (
                  <p className="form-error" style={{ marginTop: 4 }}>
                    {errors[room.id]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
