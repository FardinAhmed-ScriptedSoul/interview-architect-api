import React from 'react';
import { useNavigate } from 'react-router';
// Path updated to reflect the move to the centralized style folder
import '../style/sidebar.scss'; 

const Sidebar = ({ reports = [], onThemeToggle, isDark }) => {
    const navigate = useNavigate();
    const recentTwo = reports.slice(0, 2);

    return (
        <aside className='sidebar'>
            {/* Brand Title Layout */}
            <div className='sidebar__brand' onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                <span className='sidebar__brand-dot' />
                Interview<span className='sidebar__brand-accent'>.</span>AI
            </div>

            <div className='sidebar__divider' />

            {/* Core Navigation Controls */}
            <nav className='sidebar__nav'>
                <button className='sidebar__nav-item sidebar__nav-item--active' onClick={() => navigate('/')}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    Home
                </button>
            </nav>

            <div className='sidebar__divider' />

            {/* Recent Reports History Panels */}
            <div className='sidebar__section'>
                <p className='sidebar__section-label'>Recent Reports</p>
                {recentTwo.length === 0 && (
                    <p className='sidebar__empty'>No reports yet</p>
                )}
                {recentTwo.map(r => (
                    <div
                        key={r._id}
                        className='sidebar__report-item'
                        onClick={() => navigate(`/interview/${r._id}`)}
                    >
                        <p className='sidebar__report-title'>{r.title || 'Untitled'}</p>
                        <span className={`sidebar__report-score ${r.matchScore >= 80 ? 'score--high' : r.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>
                            {r.matchScore}%
                        </span>
                    </div>
                ))}
            </div>

            <div className='sidebar__spacer' />

            {/* Interface Theme Toggle Option */}
            <button className='sidebar__theme-toggle' onClick={onThemeToggle}>
                {isDark ? (
                    <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                        Light Mode
                    </>
                ) : (
                    <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        Dark Mode
                    </>
                )}
            </button>
        </aside>
    );
};

export default Sidebar;