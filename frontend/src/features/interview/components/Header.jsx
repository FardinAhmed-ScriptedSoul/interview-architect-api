import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../auth/hooks/useAuth";

export default function Header() {
  const { user, handleLogout, handleLogoutAll } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef(null);

  // Extract initials cleanly from core profile keys
  const userInitials = user?.username 
    ? user.username.substring(0, 2).toUpperCase() 
    : (user?.email ? user.email.substring(0, 2).toUpperCase() : "FA");
  
  const userName = user?.username || "User";
  const userRole = user?.role || "Software Engineer";
  const userEmail = user?.email || "fardinahmednihal2003@gmail.com";

  const doLogout = async () => {
    setLoggingOut(true);
    await handleLogout();
    navigate("/login");
  };

  const doLogoutAll = async () => {
    setLoggingOut(true);
    await handleLogoutAll();
    navigate("/login");
  };

  // Close dropdown if clicking away
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="app-header">
      {/* Absolute Centered Premium Glow Title */}
      <div className="app-header__center">
        <span className="glowing-motto">Let's learn and grow together</span>
      </div>

      {/* Right User Actions Block Layout */}
      <div className="app-header__right" ref={dropdownRef}>
        <button 
          className="user-profile-btn" 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          type="button"
        >
          <div className="avatar-circle">{userInitials}</div>
          <span className="user-name">{userName}</span>
          <span className={`chevron-icon ${dropdownOpen ? "open" : ""}`}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        {dropdownOpen && (
          <div className="profile-dropdown-menu">
            <div className="dropdown-user-profile">
              <div className="dropdown-avatar">{userInitials}</div>
              <div className="dropdown-identity">
                <span className="user-role">{userRole}</span>
                <span className="user-email" title={userEmail}>{userEmail}</span>
              </div>
            </div>

            <hr className="dropdown-divider" />

            <button type="button" className="dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/profile"); }}>
              <span className="item-icon">👤</span> My Profile
            </button>
            <button type="button" className="dropdown-item" onClick={() => { setDropdownOpen(false); navigate("/login"); }}>
              <span className="item-icon">👥</span> Switch Account
            </button>
            <button type="button" className="dropdown-item text-danger" onClick={doLogout} disabled={loggingOut}>
              <span className="item-icon">↪</span> {loggingOut ? "Logging out..." : "Logout"}
            </button>
            <button type="button" className="dropdown-item text-danger" onClick={doLogoutAll} disabled={loggingOut}>
              <span className="item-icon">🔒</span> Logout All Devices
            </button>
          </div>
        )}
      </div>
    </header>
  );
}