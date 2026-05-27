import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { resetPassword } from '../services/auth.api'
import '../auth.form.scss'

const ResetPassword = () => {
    const { token } = useParams()
    const navigate = useNavigate()

    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (password.length < 6) {
            setError('Password must be at least 6 characters.')
            return
        }
        if (password !== confirm) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)
        try {
            await resetPassword({ token, password })
            setSuccess(true)
            setTimeout(() => navigate('/login'), 3000)
        } catch (err) {
            setError(err.response?.data?.message || 'Reset failed. The link may have expired.')
        } finally {
            setLoading(false)
        }
    }

    // ── Success State ─────────────────────────────────────────────────────────
    if (success) {
        return (
            <main>
                <div className='form-container' style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                    <h1>Password Reset!</h1>
                    <p style={{ color: '#7d8590', marginTop: '0.75rem', fontSize: '0.9rem' }}>
                        Your password has been updated successfully.<br />
                        Redirecting to login in 3 seconds...
                    </p>
                    <Link
                        to='/login'
                        style={{ display: 'inline-block', marginTop: '1.5rem', color: '#ff2d78', fontSize: '0.9rem' }}
                    >
                        Go to Login →
                    </Link>
                </div>
            </main>
        )
    }

    // ── Reset Form ────────────────────────────────────────────────────────────
    return (
        <main>
            <div className='form-container'>
                <h1>Set New Password</h1>
                <p style={{ color: '#7d8590', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Enter your new password below. Must be at least 6 characters.
                </p>

                {error && (
                    <div style={{
                        color: '#ff4a4a',
                        backgroundColor: 'rgba(255,74,74,0.1)',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '15px',
                        fontSize: '14px',
                        textAlign: 'center',
                        border: '1px solid #ff4a4a'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className='input-group-password'>
                        <label htmlFor='password'>New Password</label>
                        <input
                            type='password'
                            id='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder='Enter your new password'
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className='input-group-password'>
                        <label htmlFor='confirm'>Confirm Password</label>
                        <input
                            type='password'
                            id='confirm'
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder='Re-enter your new password'
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type='submit'
                        className='button primary-button'
                        disabled={loading}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <p className='auth-redirect'>
                    Remembered it? <Link to='/login'>Back to Login</Link>
                </p>
            </div>
        </main>
    )
}

export default ResetPassword