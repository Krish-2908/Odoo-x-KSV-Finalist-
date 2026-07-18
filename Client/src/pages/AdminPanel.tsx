import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../services/api'

interface Employee {
    _id: string
    name: string
    email: string
    phone: string
    role: 'Admin' | 'Employee'
    status: 'Active' | 'Inactive'
}

interface Vehicle {
    _id: string
    model: string
    registrationNumber: string
    seatingCapacity: number
    fuelEfficiency: number
    ownerId: {
        name: string
        email: string
        phone: string
    }
}

interface OrgSettings {
    fuelCostPerKm: number
    allowedPaymentMethods: ('Cash' | 'Card' | 'UPI' | 'Wallet')[]
}

interface ParticipationReport {
    totalEmployees: number
    activeEmployees: number
    inactiveEmployees: number
    totalVehicles: number
}

const AdminPanel: React.FC = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<'employees' | 'settings' | 'vehicles' | 'reports'>('employees')

    // State definitions
    const [employees, setEmployees] = useState<Employee[]>([])
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [settings, setSettings] = useState<OrgSettings>({
        fuelCostPerKm: 10,
        allowedPaymentMethods: ['Cash', 'Card', 'Wallet']
    })
    const [report, setReport] = useState<ParticipationReport | null>(null)

    // Loading and message states
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    // Fetch handlers
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
            setSettings(res.data.data)
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

    // Effect triggers based on tab selection
    useEffect(() => {
        if (!user || user.role !== 'Admin') {
            navigate('/dashboard')
            return
        }

        if (activeTab === 'employees') {
            fetchEmployees()
        } else if (activeTab === 'vehicles') {
            fetchVehicles()
        } else if (activeTab === 'settings') {
            fetchSettings()
        } else if (activeTab === 'reports') {
            fetchReport()
        }
    }, [activeTab, user, navigate, fetchEmployees, fetchVehicles, fetchSettings, fetchReport])

    // Toggle active status for employee
    const handleToggleStatus = async (employeeId: string, currentStatus: 'Active' | 'Inactive') => {
        setError('')
        setMessage('')
        const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
        try {
            await API.put(`/admin/employees/${employeeId}/status`, { status: nextStatus })
            setEmployees((prev) =>
                prev.map((emp) => (emp._id === employeeId ? { ...emp, status: nextStatus } : emp))
            )
            setMessage('Employee status updated successfully.')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update employee status.')
        }
    }

    // Save configuration settings
    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setMessage('')
        try {
            await API.put('/admin/settings', settings)
            setMessage('Organization settings saved successfully.')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save settings.')
        }
    }

    // Toggle checked payment method
    const handleTogglePaymentMethod = (method: 'Cash' | 'Card' | 'UPI' | 'Wallet') => {
        setSettings((prev) => {
            const current = [...prev.allowedPaymentMethods]
            if (current.includes(method)) {
                return {
                    ...prev,
                    allowedPaymentMethods: current.filter((m) => m !== method)
                }
            } else {
                return {
                    ...prev,
                    allowedPaymentMethods: [...current, method]
                }
            }
        })
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
            {/* Admin Header */}
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
                <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {user?.name}
                </span>
            </header>

            {/* Content Container */}
            <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8">
                {/* Tabs Menu */}
                <div className="flex border-b border-slate-200 mb-8 overflow-x-auto gap-4">
                    <button
                        onClick={() => setActiveTab('employees')}
                        className={`pb-3 font-semibold text-sm border-b-2 px-1 whitespace-nowrap transition-colors ${
                            activeTab === 'employees'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Employees
                    </button>
                    <button
                        onClick={() => setActiveTab('vehicles')}
                        className={`pb-3 font-semibold text-sm border-b-2 px-1 whitespace-nowrap transition-colors ${
                            activeTab === 'vehicles'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Registered Vehicles
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`pb-3 font-semibold text-sm border-b-2 px-1 whitespace-nowrap transition-colors ${
                            activeTab === 'settings'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Organization Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`pb-3 font-semibold text-sm border-b-2 px-1 whitespace-nowrap transition-colors ${
                            activeTab === 'reports'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Reports & Metrics
                    </button>
                </div>

                {/* Notifications */}
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

                {/* Tab Contents */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* Tab: Employees */}
                        {activeTab === 'employees' && (
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="font-bold text-slate-700">Organization Employees</h3>
                                    <p className="text-xs text-slate-400">Manage account access and monitor status</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                                                <th className="px-6 py-3">Name</th>
                                                <th className="px-6 py-3">Email Address</th>
                                                <th className="px-6 py-3">Phone</th>
                                                <th className="px-6 py-3">Role</th>
                                                <th className="px-6 py-3">Status</th>
                                                <th className="px-6 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {employees.map((emp) => {
                                                const isSelf = emp._id === user?._id
                                                return (
                                                    <tr key={emp._id} className="hover:bg-slate-50/50">
                                                        <td className="px-6 py-4 font-medium text-slate-800">{emp.name}</td>
                                                        <td className="px-6 py-4 text-slate-500">{emp.email}</td>
                                                        <td className="px-6 py-4 text-slate-500">{emp.phone}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                                                                emp.role === 'Admin' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                                {emp.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                                                emp.status === 'Active' ? 'text-green-600' : 'text-red-500'
                                                            }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                                    emp.status === 'Active' ? 'bg-green-600' : 'bg-red-500'
                                                                }`}></span>
                                                                {emp.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {isSelf ? (
                                                                <span className="text-xs text-slate-350 italic">System Owner</span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleToggleStatus(emp._id, emp.status)}
                                                                    className={`px-3 py-1 text-xs font-semibold rounded border transition-colors ${
                                                                        emp.status === 'Active'
                                                                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                                                                            : 'border-green-200 text-green-600 hover:bg-green-50'
                                                                    }`}
                                                                >
                                                                    {emp.status === 'Active' ? 'Deactivate' : 'Activate'}
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            {employees.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                                        No employees found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Tab: Vehicles */}
                        {activeTab === 'vehicles' && (
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="font-bold text-slate-700">Organization Vehicles</h3>
                                    <p className="text-xs text-slate-400">Overview of all active registered commute cars</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                                                <th className="px-6 py-3">Model</th>
                                                <th className="px-6 py-3">Registration Plate</th>
                                                <th className="px-6 py-3">Seating Capacity</th>
                                                <th className="px-6 py-3">Fuel Efficiency</th>
                                                <th className="px-6 py-3">Owner</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {vehicles.map((v) => (
                                                <tr key={v._id} className="hover:bg-slate-50/50">
                                                    <td className="px-6 py-4 font-medium text-slate-800">{v.model}</td>
                                                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{v.registrationNumber}</td>
                                                    <td className="px-6 py-4 text-slate-500">{v.seatingCapacity} seats</td>
                                                    <td className="px-6 py-4 text-slate-500">{v.fuelEfficiency} km/L</td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-semibold text-slate-700">{v.ownerId?.name}</div>
                                                        <div className="text-xs text-slate-400">{v.ownerId?.email}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {vehicles.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                                        No registered vehicles found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Tab: Settings */}
                        {activeTab === 'settings' && (
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm max-w-2xl">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="font-bold text-slate-700">Organization Settings</h3>
                                    <p className="text-xs text-slate-400">Configure cost calculations and payment policies</p>
                                </div>
                                <form onSubmit={handleSaveSettings} className="p-6 space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Corporate Fuel Cost Rate (per Kilometer)
                                        </label>
                                        <div className="flex gap-2 max-w-xs items-center">
                                            <span className="text-slate-500 text-sm font-bold">$</span>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                value={settings.fuelCostPerKm}
                                                onChange={(e) => setSettings({ ...settings, fuelCostPerKm: parseFloat(e.target.value) || 0 })}
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 text-sm"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            This value is used to calculate and recommend trip fares.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                                            Allowed Payment Settlement Methods
                                        </label>
                                        <div className="space-y-2">
                                            {(['Cash', 'Card', 'UPI', 'Wallet'] as const).map((method) => (
                                                <label key={method} className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.allowedPaymentMethods.includes(method)}
                                                        onChange={() => handleTogglePaymentMethod(method)}
                                                        className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500"
                                                    />
                                                    {method}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                                    >
                                        Save Configuration
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Tab: Reports */}
                        {activeTab === 'reports' && report && (
                            <div className="space-y-6">
                                {/* Aggregation Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Total Employees</p>
                                        <p className="text-3xl font-extrabold text-slate-800 mt-2">{report.totalEmployees}</p>
                                    </div>
                                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Active Participation</p>
                                        <p className="text-3xl font-extrabold text-green-600 mt-2">{report.activeEmployees}</p>
                                    </div>
                                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Inactive Accounts</p>
                                        <p className="text-3xl font-extrabold text-red-500 mt-2">{report.inactiveEmployees}</p>
                                    </div>
                                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Registered Vehicles</p>
                                        <p className="text-3xl font-extrabold text-blue-600 mt-2">{report.totalVehicles}</p>
                                    </div>
                                </div>

                                {/* Placeholder for visual reports */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center">
                                    <p className="text-slate-400 text-sm font-medium">
                                        Completed commute analytics, cost savings, and fuel efficiency trends will render here once employees begin logging trips.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

export default AdminPanel
