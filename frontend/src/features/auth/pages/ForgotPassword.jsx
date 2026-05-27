import React, { useState } from 'react'
import { Link } from 'react-router'
import { forgotPassword } from '../services/auth.api'
import '../auth.form.scss'

const ForgotPassword = () => {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await forgotPassword({ email })
            setSent(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (sent) {
        return (
            <main>
                <div className='form-container' style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
                    <h1>Check Your Email</h1>
                    <p style={{ color: '#7d8590', marginTop: '0.75rem', fontSize: '0.9rem', lineHeight: 1.7 }}>
                        If an account exists for <strong style={{ color: '#e6edf3' }}>{email}</strong>,
                        a reset link has been sent.<br />
                        Check your inbox and spam folder.
                    </p>
                    <Link
                        to='/login'
                        style={{ display: 'inline-block', marginTop: '1.5rem', color: '#ff2d78', fontSize: '0.9rem' }}
                    >
                        ← Back to Login
                    </Link>
                </div>
            </main>
        )
    }

    return (
        <main>
            <div className='form-container'>
                <h1>Forgot Password</h1>
                <p style={{ color: '#7d8590', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    Enter your registered email and we'll send you a reset link.
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
                    <div className='input-group-email'>
                        <label htmlFor='email'>Email Address</label>
                        <input
                            type='email'
                            id='email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder='Enter your registered email'
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type='submit'
                        className='button primary-button'
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <p className='auth-redirect'>
                    <Link to='/login'>← Back to Login</Link>
                </p>
            </div>
        </main>
    )
}

export default ForgotPassword