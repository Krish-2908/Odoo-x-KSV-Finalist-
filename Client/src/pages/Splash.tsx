import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Splash: React.FC = () => {
    const { user, loading } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => {
                if (user) {
                    navigate('/dashboard')
                } else {
                    navigate('/login')
                }
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [user, loading, navigate])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800">
            <div className="text-center p-6">
                <div className="flex justify-center mb-6">
                    {/* Minimalist modern carpool icon */}
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md">
                        🚗
                    </div>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-blue-900 mb-2">
                    Enterprise Carpooling
                </h1>
                <p className="text-slate-500 font-medium max-w-sm">
                    Connecting employees for safe, sustainable, and collaborative daily commutes.
                </p>
                <div className="mt-8 flex justify-center">
                    <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        </div>
    )
}

export default Splash
