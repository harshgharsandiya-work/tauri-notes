import React, { useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import Modal from "./Modal";

/**
 * SearchUserModal — search for other users to start a DM.
 * Props:
 *   currentUserId – string   (excluded from search results)
 *   onSelectUser  – (user: {id, name}) => void
 *   onClose       – () => void
 */
export default function SearchUserModal({
  currentUserId,
  onSelectUser,
  onClose,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);

  async function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    try {
      const users = await invoke("search_users", {
        query: q,
        currentUserId: currentUserId,
      });
      setResults(users ?? []);
    } catch (err) {
      console.error("search_users failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function selectUser(user) {
    onSelectUser(user);
    onClose();
  }

  return (
    <Modal title="Find a User" onClose={onClose} size="md">
      {/* Search bar */}
      <form onSubmit={handleSearch}>
        <div className="form-group">
          <label className="form-label" htmlFor="user-search-input">
            Search by display name
          </label>
          <div className="input-row">
            <input
              id="user-search-input"
              ref={inputRef}
              className="form-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a name…"
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !query.trim()}
            >
              {loading ? "…" : "Search"}
            </button>
          </div>
        </div>
      </form>

      {/* Results */}
      {searched && (
        <div className="search-results">
          {results.length === 0 ? (
            <p className="results-empty">No users found for "{query}"</p>
          ) : (
            results.map((u) => (
              <button
                key={u.id}
                className="result-item"
                onClick={() => selectUser(u)}
              >
                <span className="result-avatar">{u.name[0].toUpperCase()}</span>
                <span className="result-name">{u.name}</span>
                <span className="result-action">Message →</span>
              </button>
            ))
          )}
        </div>
      )}
    </Modal>
  );
}
