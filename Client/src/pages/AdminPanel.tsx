import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../services/api'

// Subcomponents imports
import AdminEmployees from '../components/Admin/AdminEmployees'
import AdminVehicles from '../components/Admin/AdminVehicles'
import AdminSettings from '../components/Admin/AdminSettings'
import AdminTrips from '../components/Admin/AdminTrips'

interface Employee {
    _id: string
    name: string
    email: string
    phone: string
    role: 'Admin' | 'Employee'
    status: 'Active' | 'Inactive'
    department?: string
    manager?: string
    officeLocation?: string
}

interface Vehicle {
    _id: string
    model: string
    registrationNumber: string
    seatingCapacity: number
    fuelEfficiency: number
    isApproved: boolean
    ownerId: {
        _id: string
        name: string
        email: string
        phone: string
    } | null
}

interface OrgSettings {
    fuelCostPerKm: number
    fuelCostPerLitre: number
    defaultCarpoolPolicy?: string
    allowedPaymentMethods: ('Cash' | 'Card' | 'UPI' | 'Wallet')[]
}

interface CompanyDetails {
    name: string
    domain: string
    address: string
    industry?: string
    contactInfo?: string
    totalEmployees: number
}

interface ParticipationReport {
    totalEmployees: number
    activeEmployees: number
    inactiveEmployees: number
    totalVehicles: number
}

const AdminPanel: React.FC = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<'employees' | 'vehicles' | 'trips' | 'settings' | 'reports'>('employees')

    // State definitions
    const [employees, setEmployees] = useState<Employee[]>([])
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [settings, setSettings] = useState<OrgSettings | null>(null)
    const [company, setCompany] = useState<CompanyDetails | null>(null)
    const [report, setReport] = useState<ParticipationReport | null>(null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const fetchEmployees = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await API.get('/admin/employees')
            setEmployees(res.data.data)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load employees.')
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchVehicles = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await API.get('/admin/vehicles')
            setVehicles(res.data.data)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load vehicles.')
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchSettings = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await API.get('/admin/settings')
            setSettings(res.data.data.settings)
            setCompany(res.data.data.company)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load settings.')
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchReport = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await API.get('/admin/reports/participation')
            setReport(res.data.data)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load participation reports.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!user || user.role !== 'Admin') {
            navigate('/dashboard')
            return
        }

        if (activeTab === 'employees') {
            fetchEmployees()
        } else if (activeTab === 'vehicles') {
            // Need both vehicles and employees list to assign owner during register
            fetchVehicles()
            fetchEmployees()
        } else if (activeTab === 'settings') {
            fetchSettings()
        } else if (activeTab === 'reports') {
            fetchReport()
        }
    }, [activeTab, user, navigate, fetchEmployees, fetchVehicles, fetchSettings, fetchReport])

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
                    <span className="font-bold text-lg text-blue-900">Admin Control Panel</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
                        Admin Mode: {user?.name}
                    </span>
                    <button
                        onClick={handleLogout}
                        className="px-3 py-1.5 border border-red-200 text-red-650 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Container */}
            <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8">
                {/* Tabs navigation */}
                <div className="flex border-b border-slate-200 mb-8 overflow-x-auto gap-4">
                    {[
                        { id: 'employees', label: 'Employees' },
                        { id: 'vehicles', label: 'Registered Vehicles' },
                        { id: 'trips', label: 'Company Trip History' },
                        { id: 'settings', label: 'Organization Settings' },
                        { id: 'reports', label: 'Reports & Metrics' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-3 font-semibold text-sm border-b-2 px-1 whitespace-nowrap transition-colors ${
                                activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {error}
                    </div>
                )}

                {loading && !employees.length && !vehicles.length && !settings ? (
                    <div className="flex justify-center items-center py-16">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-200">
                        {/* Tab contents */}
                        {activeTab === 'employees' && (
                            <AdminEmployees
                                employees={employees}
                                onRefresh={fetchEmployees}
                                currentUser={user}
                            />
                        )}

                        {activeTab === 'vehicles' && (
                            <AdminVehicles
                                vehicles={vehicles}
                                employees={employees}
                                onRefresh={fetchVehicles}
                            />
                        )}

                        {activeTab === 'trips' && <AdminTrips />}

                        {activeTab === 'settings' && settings && company && (
                            <AdminSettings
                                settings={settings}
                                company={company}
                                onRefresh={fetchSettings}
                            />
                        )}

                        {activeTab === 'reports' && report && (
                            <div className="space-y-6">
                                {/* Aggregation Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Total Employees</p>
                                        <p className="text-3xl font-extrabold text-slate-800 mt-2">{report.totalEmployees}</p>
                                    </div>
                                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Active Commuters</p>
                                        <p className="text-3xl font-extrabold text-green-600 mt-2">{report.activeEmployees}</p>
                                    </div>
                                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Revoked Accounts</p>
                                        <p className="text-3xl font-extrabold text-red-500 mt-2">{report.inactiveEmployees}</p>
                                    </div>
                                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Registered Vehicles</p>
                                        <p className="text-3xl font-extrabold text-blue-600 mt-2">{report.totalVehicles}</p>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
                                    <p className="text-slate-400 text-sm font-medium">
                                        Completed commute analytics, cost savings, carbon offset metrics and fuel efficiency trends will display here in real-time as users begin completing trips.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}

export default AdminPanel
