import React, { useEffect } from "react";

/**
 * Generic modal wrapper.
 * Props:
 *   title    – string displayed in the header
 *   onClose  – () => void  (also triggered by Escape key or overlay click)
 *   size     – 'sm' | 'md' | 'lg'  (default 'md')
 *   children – modal body content
 */
export default function Modal({ title, onClose, size = "md", children }) {
  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`modal modal-${size}`} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
