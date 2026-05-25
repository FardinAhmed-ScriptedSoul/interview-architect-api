import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import './sidebar.scss'

const Sidebar = ({ reports = [], onThemeToggle, isDark }) => {
    const { user, handleLogout, handleLogoutAll } = useAuth()
    const navigate = useNavigate()
    const [profileOpen, setProfileOpen] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

    const doLogout = async () => {
        setLoggingOut(true)
        await handleLogout()
        navigate('/login')
    }

    const doLogoutAll = async () => {
        setLoggingOut(true)
        await handleLogoutAll()
        navigate('/login')
    }

    const initials = user?.username
        ? user.username.slice(0, 2).toUpperCase()
        : user?.email?.slice(0, 2).toUpperCase() || '??'

    const recentTwo = reports.slice(0, 2)

    return (
        <aside className='sidebar'>
            {/* Brand */}
            <div className='sidebar__brand'>
                <span className='sidebar__brand-dot' />
                Interview<span className='sidebar__brand-accent'>.</span>AI
            </div>

            {/* Profile block */}
            <div className='sidebar__profile' onClick={() => setProfileOpen(o => !o)}>
                <div className='sidebar__avatar'>{initials}</div>
                <div className='sidebar__user-info'>
                    <p className='sidebar__username'>{user?.username || 'User'}</p>
                    <p className='sidebar__email'>{user?.email || ''}</p>
                </div>
                <span className={`sidebar__chevron ${profileOpen ? 'sidebar__chevron--open' : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>

            {/* Profile dropdown */}
            {profileOpen && (
                <div className='sidebar__dropdown'>
                    <button
                        className='sidebar__dropdown-item'
                        onClick={doLogout}
                        disabled={loggingOut}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        {loggingOut ? 'Logging out...' : 'Logout'}
                    </button>
                    <button
                        className='sidebar__dropdown-item sidebar__dropdown-item--danger'
                        onClick={doLogoutAll}
                        disabled={loggingOut}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        Logout All Devices
                    </button>
                    <button
                        className='sidebar__dropdown-item'
                        onClick={() => navigate('/login')}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        Switch Account
                    </button>
                </div>
            )}

            <div className='sidebar__divider' />

            {/* Nav */}
            <nav className='sidebar__nav'>
                <button className='sidebar__nav-item sidebar__nav-item--active' onClick={() => navigate('/')}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Home
                </button>
            </nav>

            <div className='sidebar__divider' />

            {/* Recent reports */}
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

            {/* Theme toggle */}
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
    )
}

export default Sidebar