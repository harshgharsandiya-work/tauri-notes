import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Modal from "./Modal";

/**
 * LoginSignupModal
 * Props:
 *   onLoginSuccess – (user) => void
 *   onClose        – () => void
 */
export default function LoginSignupModal({ onLoginSuccess, onClose }) {
  const [mode, setMode] = useState("login"); // "login" or "signup"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername) return setError("Username is required.");
    if (!trimmedPassword) return setError("Password is required.");

    setLoading(true);
    setError("");

    try {
      const user = await invoke("login_user", {
        username: trimmedUsername,
        password: trimmedPassword,
      });
      onLoginSuccess(user);
    } catch (err) {
      setError(String(err) || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedPasswordConfirm = passwordConfirm.trim();
    const trimmedName = name.trim();

    if (!trimmedUsername) return setError("Username is required.");
    if (trimmedUsername.length > 50)
      return setError("Username must be 50 characters or fewer.");
    if (!trimmedPassword) return setError("Password is required.");
    if (trimmedPassword.length < 6)
      return setError("Password must be at least 6 characters.");
    if (trimmedPassword !== trimmedPasswordConfirm)
      return setError("Passwords do not match.");

    setLoading(true);
    setError("");

    try {
      const user = await invoke("signup_user", {
        username: trimmedUsername,
        password: trimmedPassword,
        name: trimmedName || null,
      });
      onLoginSuccess(user);
    } catch (err) {
      setError(String(err) || "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <Modal title={isLogin ? "Login" : "Sign Up"} onClose={onClose} size="md">
      <div className="auth-modal">
        <form onSubmit={isLogin ? handleLogin : handleSignup}>
          {/* Username */}
          <div className="form-group">
            <label className="form-label" htmlFor="auth-username">
              Username
            </label>
            <input
              id="auth-username"
              className="form-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              maxLength={50}
              autoFocus
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={loading}
            />
          </div>

          {/* Confirm Password (signup only) */}
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-password-confirm">
                Confirm Password
              </label>
              <input
                id="auth-password-confirm"
                className="form-input"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Confirm password"
                disabled={loading}
              />
            </div>
          )}

          {/* Display Name (signup only) */}
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">
                Display Name (optional)
              </label>
              <input
                id="auth-name"
                className="form-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Leave blank for random name"
                maxLength={50}
                disabled={loading}
              />
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Please wait…" : isLogin ? "Login" : "Sign Up"}
            </button>
          </div>
        </form>

        {/* Toggle mode */}
        <div className="auth-toggle">
          {isLogin ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                className="auth-toggle-btn"
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                disabled={loading}
              >
                Sign up here
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="auth-toggle-btn"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                disabled={loading}
              >
                Login here
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
