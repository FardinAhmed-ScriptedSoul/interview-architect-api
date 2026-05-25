import { useContext, useEffect } from "react";
// 🟢 FIXED: Stepping back one level, then diving into the services directory
import { AuthContext } from "../auth.context.jsx";
import { login, register, logout, getMe, logoutAll } from "../services/auth.api";

export const useAuth = () => {
    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context

    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const response = await login({ email, password })
            if (response?.data?.user) {
                setUser(response.data.user)
                return response.data.user
            }
        } catch (err) {
            console.error("Login verification failed:", err)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const response = await register({ username, email, password })
            if (response?.data?.user) {
                setUser(response.data.user)
            }
        } catch (err) {
            console.error("Registration failed:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            setUser(null)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleLogoutAll = async () =>{
        setLoading(true)
        try{
            await logoutAll()
            setUser(null)
        }catch(err){
            console.error(err)
        }finally{
            setLoading(false)
        }
    }

    useEffect(() => {
        const getAndSetUser = async () => {
            try {
                const response = await getMe()
                if (response?.data) {
                    setUser(response.data)
                }
            } catch (err) { 
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        getAndSetUser()
    }, [])

    return { user, loading, handleRegister, handleLogin, handleLogout , handleLogoutAll}
}