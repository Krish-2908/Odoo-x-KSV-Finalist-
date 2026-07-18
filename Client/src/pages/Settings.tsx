import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../services/api'

const Settings: React.FC = () => {
    const { user, refreshUser } = useAuth()
    const navigate = useNavigate()

    const [name, setName] = useState(user?.name || '')
    const [phone, setPhone] = useState(user?.phone || '')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setMessage('')
        setSubmitting(true)
        try {
            await API.put('/auth/profile', { name, phone })
            setMessage('Profile updated successfully.')
            await refreshUser() // Refresh auth state
        } catch (err: any) {
            console.error(err)
            setError(err.response?.data?.message || 'Failed to update profile settings.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-slate-500 hover:text-slate-700 text-sm font-semibold flex items-center gap-1"
                    >
                        <span>←</span> Dashboard
                    </button>
                    <span className="text-slate-300">|</span>
                    <span className="font-bold text-lg text-blue-900">Account Settings</span>
                </div>
            </header>

            {/* Profile Content */}
            <main className="flex-1 max-w-2xl w-full mx-auto p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-extrabold text-slate-800">My Profile</h1>
                    <p className="text-sm text-slate-500">Update your account information and contact numbers.</p>
                </div>

                {message && (
                    <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                Work Email (Read-Only)
                            </label>
                            <input
                                type="email"
                                disabled
                                value={user?.email || ''}
                                className="w-full px-4 py-2 border border-slate-100 rounded-lg bg-slate-100/70 text-slate-400 text-sm cursor-not-allowed"
                            />
                            <p className="text-xs text-slate-400 mt-1">
                                Contact your organization administrator to modify your registered domain email address.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm"
                            >
                                {submitting ? 'Saving Changes...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}

export default Settings
