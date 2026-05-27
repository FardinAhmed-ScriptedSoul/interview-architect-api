import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth';

export default function NavbarProfile() {
  const { user, handleLogout, handleLogoutAll } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef(null);

  // Extract first two character capitals cleanly from username or email profile anchors
  const initials = user?.username
      ? user.username.slice(0, 2).toUpperCase()
      : user?.email?.slice(0, 2).toUpperCase() || '??';

  const doLogout = async () => {
      setLoggingOut(true);
      await handleLogout();
      navigate('/login');
  };

  const doLogoutAll = async () => {
      setLoggingOut(true);
      await handleLogoutAll();
      navigate('/login');
  };

  // Close dropdown menu if clicking away
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', zIndex: 100 }} ref={dropdownRef}>
      {/* Clickable Profile Trigger Capsule */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: '#111214',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '0.45rem 0.85rem',
          borderRadius: '9999px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
      >
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: '#d20d3b', // Pulls your exact theme color brand accent token
          color: '#ffffff',
          fontWeight: '700',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          letterSpacing: '0.05em'
        }}>
          {initials}
        </div>
        
        <span style={{ color: 'rgba(255, 255, 255, 0.88)', fontSize: '0.82rem', fontWeight: '500' }}>
          {user.username || 'User'}
        </span>
        
        <span style={{ 
          color: 'rgba(255, 255, 255, 0.38)', 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
          transition: 'transform 0.2s',
          display: 'flex',
          alignItems: 'center'
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
        </span>
      </button>

      {/* Floating Dropdown Execution Card */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 0.5rem)',
          right: 0,
          width: '220px',
          background: '#111214',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
          padding: '0.35rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.15rem'
        }}>
          {/* Readout Meta Profile Segment */}
          <div style={{ padding: '0.5rem 0.65rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '0.2rem' }}>
            <p style={{ color: 'rgba(255, 255, 255, 0.88)', fontSize: '0.8rem', fontWeight: '600', margin: 0 }}>
              {user.username || 'Engineer'}
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.38)', fontSize: '0.68rem', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </p>
          </div>

          <button
            onClick={doLogout}
            disabled={loggingOut}
            style={dropdownItemStyle}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>

          <button
            onClick={doLogoutAll}
            disabled={loggingOut}
            style={{...dropdownItemStyle, color: '#d20d3b'}}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(210, 13, 59, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Logout All Devices
          </button>

          <button
            onClick={() => { setIsOpen(false); navigate('/login'); }}
            style={dropdownItemStyle}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Switch Account
          </button>
        </div>
      )}
    </div>
  );
}

const dropdownItemStyle = {
  background: 'transparent',
  border: 'none',
  color: 'rgba(255, 255, 255, 0.55)',
  fontSize: '0.76rem',
  textAlign: 'left',
  padding: '0.5rem 0.65rem',
  borderRadius: '5px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  transition: 'all 0.15s ease',
  width: '100%'
};