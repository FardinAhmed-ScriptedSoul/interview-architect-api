// Login.jsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import FloatingText from '../components/FloatingText'

const Login = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // Consuming your real global auth interaction hook
    const { loading, handleLogin } = useAuth()
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await handleLogin({ email, password })
            navigate("/")
        } catch (err) {
            console.error("Login component intercepted an execution error.", err)
        }
    }

    return (
        <div className="auth-split-wrapper">
            {/* Left Side: Smooth Slow-Motion Brand Banner */}
            <FloatingText />

            {/* Right Side: Interactive Forms Core Shell */}
            <main>
                <div className="form-container">
                    <h1>Welcome Back</h1>
                    <p>Enter your credentials to re-initialize your engineering simulator context.</p>

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@domain.com"
                                disabled={loading}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="button primary-button"
                            disabled={loading}
                        >
                            {loading ? "Verifying Credentials..." : "Sign In"}
                        </button>
                    </form>

                    {/* 💡 POSITIONED SECURELY BELOW SIGN IN BUTTON */}
                    <p className="auth-helper-text" style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#7d8590' }}>
                        Can't recall the password?{' '}
                        <Link 
                            to="/forgot-password" 
                            style={{ color: '#ff2d78', textDecoration: 'none', fontWeight: '500' }}
                        >
                            Reset it here
                        </Link>
                    </p>

                    <div className="auth-divider" style={{ margin: '1.5rem 0' }} />

                    <p className="auth-redirect">
                        Don't have an account? <Link to="/register">Register</Link>
                    </p>
                </div>
            </main>
        </div>
    )
}

export default Login