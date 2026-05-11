import React, { useState } from "react";
import Modal from "./Modal";

/**
 * LeaveRoomModal
 * Props:
 *   room      – { id, name }
 *   onConfirm – () => Promise<void>
 *   onClose   – () => void
 */
export default function LeaveRoomModal({ room, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLeave() {
    setLoading(true);
    setError("");

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(String(err) || "Failed to leave room.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Leave Room" onClose={onClose} size="md">
      <div className="delete-room-modal">
        <p className="delete-room-warning">
          You will leave <strong>{room.name}</strong> and stop receiving
          messages from this room.
        </p>
        <p className="delete-room-hint">
          You can rejoin later if you have access.
        </p>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleLeave}
            disabled={loading}
          >
            {loading ? "Leaving…" : "Leave Room"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
