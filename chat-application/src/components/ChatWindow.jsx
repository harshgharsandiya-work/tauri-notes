import React, { useState, useEffect, useRef } from "react";

/**
 * ChatWindow
 * Props:
 *   user       – { id, name }
 *   activeChat – { type: 'dm'|'room', id, name, isPrivate } | null
 *   messages   – [{ id, sender_id, sender_name, content, created_at }]
 *   onSend     – (content: string) => Promise<void>
 */
export default function ChatWindow({ user, activeChat, messages, onSend }) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear input when the active chat changes
  useEffect(() => {
    setInput("");
  }, [activeChat?.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await onSend(text);
      setInput("");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  // ── Empty state ──────────────────────────
  if (!activeChat) {
    return (
      <div className="chat-empty-state">
        <div className="chat-empty-inner">
          <div className="chat-empty-emoji">💬</div>
          <h2 className="chat-empty-title">Welcome to ChatApp</h2>
          <p className="chat-empty-sub">
            Pick a conversation on the left or start a new one.
          </p>
          <div className="chat-empty-hints">
            <div className="hint-item">
              <span>➕</span>
              <span>Press <strong>+</strong> next to Direct Messages to find someone</span>
            </div>
            <div className="hint-item">
              <span>🔍</span>
              <span>Browse or create rooms with the Rooms section</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Header ─────────────────────────────
  const isDM   = activeChat.type === "dm";
  const icon   = isDM ? "👤" : activeChat.isPrivate ? "🔒" : "#";
  const sub    = isDM ? "Direct Message" : activeChat.isPrivate ? "Private Room" : "Public Room";

  return (
    <div className="chat-window">
      {/* Header */}
      <header className="chat-header">
        <div className="chat-header-left">
          <span className="chat-header-icon">{icon}</span>
          <div>
            <h2 className="chat-header-title">{activeChat.name}</h2>
            <p className="chat-header-sub">{sub}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="messages-area">
        {messages.length === 0 ? (
          <div className="messages-empty">
            <span>No messages yet — say hello! 👋</span>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe   = msg.sender_id === user?.id;
            const prev   = messages[i - 1];
            // Show sender name in room chats when sender changes
            const showSender =
              !isMe &&
              activeChat.type === "room" &&
              prev?.sender_id !== msg.sender_id;

            return (
              <div
                key={msg.id}
                className={`msg ${isMe ? "msg-mine" : "msg-theirs"}`}
              >
                {showSender && (
                  <div className="msg-sender-name">{msg.sender_name}</div>
                )}
                <div className="msg-bubble">
                  <span className="msg-text">{msg.content}</span>
                  <span className="msg-time">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className="msg-input-form" onSubmit={handleSubmit}>
        <div className="msg-input-wrap">
          <input
            className="msg-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${isDM ? activeChat.name : "#" + activeChat.name}`}
            disabled={sending}
            autoFocus
          />
          <button
            className="send-btn"
            type="submit"
            disabled={!input.trim() || sending}
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
