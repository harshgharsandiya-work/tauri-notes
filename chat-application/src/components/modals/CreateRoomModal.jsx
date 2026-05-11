import React, { useState } from "react";
import Modal from "./Modal";

/**
 * CreateRoomModal
 * Props:
 *   onCreate – ({ name, isPrivate, code }) => Promise<Room>
 *   onClose  – (room?: Room) => void   room is passed when created
 */
export default function CreateRoomModal({ onCreate, onClose }) {
  const [name,      setName]      = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [code,      setCode]      = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedCode = code.trim();

    if (!trimmedName)                return setError("Room name is required.");
    if (trimmedName.length > 50)     return setError("Room name must be 50 chars or fewer.");
    if (isPrivate && !trimmedCode)   return setError("A join code is required for private rooms.");

    setLoading(true);
    setError("");
    try {
      const room = await onCreate({
        name: trimmedName,
        isPrivate,
        code: isPrivate ? trimmedCode : null,
      });
      onClose(room);
    } catch (err) {
      setError(String(err) || "Failed to create room.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Create a Room" onClose={() => onClose(null)} size="md">
      <form onSubmit={handleSubmit}>
        {/* Room name */}
        <div className="form-group">
          <label className="form-label" htmlFor="room-name">
            Room Name
          </label>
          <input
            id="room-name"
            className="form-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. general, design-team"
            maxLength={50}
            autoFocus
          />
        </div>

        {/* Private toggle */}
        <div className="form-group">
          <div className="toggle-row" onClick={() => setIsPrivate((p) => !p)}>
            <div className="toggle-text">
              <span className="form-label" style={{ marginBottom: 0 }}>
                Private Room
              </span>
              <span className="form-hint">
                Only people with the join code can enter
              </span>
            </div>
            <div className={`toggle ${isPrivate ? "toggle-on" : ""}`}>
              <div className="toggle-knob" />
            </div>
          </div>
        </div>

        {/* Join code (only when private) */}
        {isPrivate && (
          <div className="form-group">
            <label className="form-label" htmlFor="room-code">
              Join Code
            </label>
            <input
              id="room-code"
              className="form-input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Choose a secret code"
              maxLength={20}
            />
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onClose(null)}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating…" : "Create Room"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
