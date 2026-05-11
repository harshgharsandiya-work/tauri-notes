import React from "react";

/**
 * Sidebar
 * Props:
 *   user          – { id, name }
 *   myRooms       – [{ id, name, is_private }]
 *   dmPartners    – [{ id, name }]
 *   activeChat    – { type: 'dm'|'room', id, name, isPrivate } | null
 *   onSelectDM    – (partner) => void
 *   onSelectRoom  – (room) => void
 *   onOpenModal   – (modalKey: string) => void
 */
export default function Sidebar({
  user,
  myRooms,
  dmPartners,
  activeChat,
  onSelectDM,
  onSelectRoom,
  onOpenModal,
}) {
  const firstChar = (str) => (str ? str[0].toUpperCase() : "?");

  return (
    <aside className="sidebar">
      {/* ── App Header ── */}
      <div className="sidebar-header">
        <span className="app-logo">💬</span>
        <span className="app-name">ChatApp</span>
      </div>

      {/* ── User Profile ── */}
      <div className="user-profile">
        <div className="avatar avatar-lg">{firstChar(user?.name)}</div>
        <div className="user-info">
          <span className="user-name">{user?.name ?? "…"}</span>
          <span className="user-tag">You</span>
        </div>
        <button
          className="icon-btn"
          onClick={() => onOpenModal("rename")}
          title="Change display name"
        >
          ✏️
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        {/* Direct Messages */}
        <section className="nav-section">
          <div className="nav-section-header">
            <span className="nav-section-title">Direct Messages</span>
            <button
              className="icon-btn icon-btn-sm"
              onClick={() => onOpenModal("searchUser")}
              title="Start a new DM"
            >
              +
            </button>
          </div>

          <div className="nav-list">
            {dmPartners.length === 0 && (
              <p className="nav-empty">No conversations yet</p>
            )}
            {dmPartners.map((p) => {
              const active =
                activeChat?.type === "dm" && activeChat.id === p.id;
              return (
                <button
                  key={p.id}
                  className={`nav-item ${active ? "active" : ""}`}
                  onClick={() => onSelectDM(p)}
                >
                  <span className="dm-avatar">{firstChar(p.name)}</span>
                  <span className="nav-item-label">{p.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Rooms */}
        <section className="nav-section">
          <div className="nav-section-header">
            <span className="nav-section-title">Rooms</span>
            <div className="nav-section-actions">
              <button
                className="icon-btn icon-btn-sm"
                onClick={() => onOpenModal("createRoom")}
                title="Create a room"
              >
                +
              </button>
              <button
                className="icon-btn icon-btn-sm"
                onClick={() => onOpenModal("browseRooms")}
                title="Browse rooms"
              >
                🔍
              </button>
            </div>
          </div>

          <div className="nav-list">
            {myRooms.length === 0 && (
              <p className="nav-empty">No rooms joined yet</p>
            )}
            {myRooms.map((r) => {
              const active =
                activeChat?.type === "room" && activeChat.id === r.id;
              return (
                <button
                  key={r.id}
                  className={`nav-item ${active ? "active" : ""}`}
                  onClick={() => onSelectRoom(r)}
                >
                  <span className="nav-item-icon">
                    {r.is_private ? "🔒" : "#"}
                  </span>
                  <span className="nav-item-label">{r.name}</span>
                </button>
              );
            })}
          </div>

          {/* Browse button at bottom of rooms */}
          <button
            className="browse-rooms-btn"
            onClick={() => onOpenModal("browseRooms")}
          >
            Browse all rooms →
          </button>
        </section>
      </nav>
    </aside>
  );
}
