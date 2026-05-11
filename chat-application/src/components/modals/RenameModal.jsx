import React, { useState } from "react";
import Modal from "./Modal";

/**
 * RenameModal — let the user change their display name.
 * Props:
 *   currentName – string
 *   onRename    – (newName: string) => Promise<void>
 *   onClose     – () => void
 */
export default function RenameModal({ currentName, onRename, onClose }) {
  const [name, setName]       = useState(currentName ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed)            return setError("Name cannot be empty.");
    if (trimmed.length > 32) return setError("Name must be 32 characters or fewer.");
    if (trimmed === currentName) { onClose(); return; }

    setLoading(true);
    setError("");
    try {
      await onRename(trimmed);
      onClose();
    } catch (err) {
      setError(String(err) || "Failed to update name.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Change Display Name" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="rename-input">
            Display Name
          </label>
          <input
            id="rename-input"
            className="form-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your display name"
            maxLength={32}
            autoFocus
          />
          {error && <span className="form-error">{error}</span>}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving…" : "Save Name"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
