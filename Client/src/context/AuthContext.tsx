import React, { createContext, useState, useEffect, useContext } from 'react'
import API from '../services/api'

interface User {
    _id: string
    companyId: string
    name: string
    email: string
    role: 'Admin' | 'Employee'
    status: 'Active' | 'Inactive'
    phone: string
    profilePicture?: string
}

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (token: string, userData: User) => void
    logout: () => void
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    const refreshUser = async () => {
        const token = localStorage.getItem('token')
        if (!token) {
            setUser(null)
            setLoading(false)
            return
        }
        try {
            const res = await API.get('/auth/me')
            if (res.data && res.data.data) {
                setUser(res.data.data)
            } else {
                logout()
            }
        } catch (error) {
            console.error('Failed to restore user session:', error)
            logout()
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshUser()
    }, [])

    const login = (token: string, userData: User) => {
        localStorage.setItem('token', token)
        setUser(userData)
    }

    const logout = () => {
        localStorage.removeItem('token')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
