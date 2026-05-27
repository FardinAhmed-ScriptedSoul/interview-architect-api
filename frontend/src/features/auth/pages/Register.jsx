import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import FloatingText from '../components/FloatingText'

const Register = () => {
    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // Consuming your actual authentication feature hook mechanics
    const { loading, handleRegister } = useAuth()
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        await handleRegister({ username, email, password })
        navigate("/")
    }

    return (
        <div className="auth-split-wrapper">
            {/* Left Side: Smooth Slow-Motion Brand Banner */}
            <FloatingText />

            {/* Right Side: Interactive Forms Core Shell */}
            <main>
                <div className="form-container">
                    <h1>Create Account</h1>
                    <p>Join thousands of developers mastering system architecture and interview execution mechanics.</p>

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="username">Username</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                disabled={loading}
                            />
                        </div>

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
                            {loading ? "Creating Account..." : "Register"}
                        </button>
                    </form>

                    <div className="auth-divider" />

                    <p className="auth-redirect">
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                </div>
            </main>
        </div>
    )
}

export default Register