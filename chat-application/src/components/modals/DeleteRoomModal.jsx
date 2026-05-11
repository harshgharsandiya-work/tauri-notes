import React, { useState } from "react";
import Modal from "./Modal";

/**
 * DeleteRoomModal
 * Props:
 *   room      – { id, name }
 *   onConfirm – () => Promise<void>
 *   onClose   – () => void
 */
export default function DeleteRoomModal({ room, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(String(err) || "Failed to delete room.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Delete Room" onClose={onClose} size="md">
      <div className="delete-room-modal">
        <p className="delete-room-warning">
          This will permanently delete <strong>{room.name}</strong> and all of
          its messages.
        </p>
        <p className="delete-room-hint">This action cannot be undone.</p>

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
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting…" : "Delete Room"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
