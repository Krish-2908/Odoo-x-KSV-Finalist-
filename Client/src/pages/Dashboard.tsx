import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    if (!user) {
        return (
            <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4">
                <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
                    <p className="text-slate-600 mb-4">You are not authenticated.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        )
    }

    const isAdmin = user.role === 'Admin'

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
            {/* Navigation Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-blue-900 tracking-tight">Carpool Enterprise</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm font-bold text-slate-700">{user.name}</p>
                        <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                    </div>
                    {!isAdmin && (
                        <button
                            onClick={() => navigate('/wallet')}
                            className="px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors"
                        >
                            Wallet
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/settings')}
                        className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
                    >
                        Settings
                    </button>
                    <button
                        onClick={handleLogout}
                        className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Main Area */}
            <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-800">Welcome Back, {user.name}!</h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Enterprise Carpooling Platform of {user.email.split('@')[1]}
                    </p>
                </div>

                {isAdmin ? (
                    /* Admin Option Block */
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-2xl font-bold">
                                ⚙️
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">Company Administration Panel</h3>
                                <p className="text-sm text-slate-500">
                                    Manage employees, vehicles, organization configurations, and view metrics.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/admin')}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                        >
                            Open Admin Panel
                        </button>
                    </div>
                ) : (
                    /* Employee Option Blocks */
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Find a Ride */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-2xl font-bold mb-4">
                                    🔍
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg">Find a Ride</h3>
                                <p className="text-sm text-slate-500 mt-2 mb-6">
                                    Search for rides offered by colleagues. Filter by date and seats. Book instantly.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/find-ride')}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                            >
                                Find a Ride
                            </button>
                        </div>

                        {/* Offer a Ride */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 text-2xl font-bold mb-4">
                                    ➕
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg">Offer a Ride</h3>
                                <p className="text-sm text-slate-500 mt-2 mb-6">
                                    Publish a commute in your registered vehicle. Share fuel costs and connect with fellow employees.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/offer-ride')}
                                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                            >
                                Offer a Ride
                            </button>
                        </div>

                        {/* My Bookings */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 text-2xl font-bold mb-4">
                                    🎫
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg">My Bookings</h3>
                                <p className="text-sm text-slate-500 mt-2 mb-6">
                                    View the status of your ride booking requests and cancel pending ones.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/my-bookings')}
                                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                            >
                                View My Bookings
                            </button>
                        </div>

                        {/* Driver Dashboard */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 text-2xl font-bold mb-4">
                                    🚘
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg">Driver Dashboard</h3>
                                <p className="text-sm text-slate-500 mt-2 mb-6">
                                    Manage incoming booking requests for your rides and view your published commutes.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/driver')}
                                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                            >
                                Driver Dashboard
                            </button>
                        </div>

                        {/* My Wallet */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 text-2xl font-bold mb-4">
                                    💳
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg">My Wallet</h3>
                                <p className="text-sm text-slate-500 mt-2 mb-6">
                                    View your wallet balance, top up funds, and review your full transaction history.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/wallet')}
                                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                            >
                                Open Wallet
                            </button>
                        </div>

                        {/* My Vehicles */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 text-2xl font-bold mb-4">
                                    🚗
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg">My Vehicles</h3>
                                <p className="text-sm text-slate-500 mt-2 mb-6">
                                    Register and manage your personal vehicles for offering rides to colleagues.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/vehicles')}
                                className="w-full py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                            >
                                Manage Vehicles
                            </button>
                        </div>

                        {/* Saved Places */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 text-2xl font-bold mb-4">
                                    📍
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg">Saved Places</h3>
                                <p className="text-sm text-slate-500 mt-2 mb-6">
                                    Save your favourite locations like Home and Office for quick address fill-in when creating rides.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/saved-places')}
                                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                            >
                                Manage Saved Places
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default Dashboard
