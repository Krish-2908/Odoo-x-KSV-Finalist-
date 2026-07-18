import React, { useState } from 'react'
import API from '../../services/api'

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

interface Employee {
    _id: string
    name: string
    email: string
}

interface AdminVehiclesProps {
    vehicles: Vehicle[]
    employees: Employee[]
    onRefresh: () => void
}

const AdminVehicles: React.FC<AdminVehiclesProps> = ({ vehicles, employees, onRefresh }) => {
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)

    // Form state
    const [ownerId, setOwnerId] = useState('')
    const [model, setModel] = useState('')
    const [registrationNumber, setRegistrationNumber] = useState('')
    const [seatingCapacity, setSeatingCapacity] = useState('')
    const [fuelEfficiency, setFuelEfficiency] = useState('')

    const [submitting, setSubmitting] = useState(false)
    const [modalError, setModalError] = useState('')

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setModalError('')
        const capacity = parseInt(seatingCapacity)
        const efficiency = parseFloat(fuelEfficiency)

        if (!ownerId || !model || !registrationNumber || isNaN(capacity) || isNaN(efficiency)) {
            setModalError('All fields are required.')
            return
        }

        setSubmitting(true)
        try {
            await API.post('/admin/vehicles', {
                ownerId,
                model,
                registrationNumber,
                seatingCapacity: capacity,
                fuelEfficiency: efficiency
            })
            setShowAddModal(false)
            // Reset
            setOwnerId('')
            setModel('')
            setRegistrationNumber('')
            setSeatingCapacity('')
            setFuelEfficiency('')
            onRefresh()
        } catch (err: any) {
            setModalError(err.response?.data?.message || 'Failed to add vehicle.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Vehicle Management</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Review and manage company carpooling vehicles</p>
                </div>
                <button
                    onClick={() => { setShowAddModal(true); setModalError(''); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                    + Register Vehicle
                </button>
            </div>

            {/* Vehicle Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                                <th className="px-6 py-4">Model</th>
                                <th className="px-6 py-4">Plate Number</th>
                                <th className="px-6 py-4">Assigned Driver</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {vehicles.map((v) => (
                                <tr key={v._id} className="hover:bg-slate-50/40 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800">{v.model}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500 uppercase">{v.registrationNumber}</td>
                                    <td className="px-6 py-4 text-slate-650">
                                        {v.ownerId ? (
                                            <div>
                                                <p className="font-semibold text-slate-700 leading-none">{v.ownerId.name}</p>
                                                <p className="text-xs text-slate-400 mt-1">{v.ownerId.email}</p>
                                            </div>
                                        ) : (
                                            <span className="text-slate-350 italic">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                                            Approved
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedVehicle(v)}
                                            className="text-xs px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 font-semibold rounded-lg transition-colors text-slate-600"
                                        >
                                            Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {vehicles.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                                        No registered vehicles found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Vehicle Details */}
            {selectedVehicle && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-slate-800 text-lg">Vehicle Details</h3>
                            <button onClick={() => setSelectedVehicle(null)} className="text-slate-450 hover:text-slate-600 text-xl leading-none">×</button>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Model</span>
                                    <span className="font-bold text-slate-800">{selectedVehicle.model}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Plate Number</span>
                                    <span className="font-mono font-bold text-slate-800">{selectedVehicle.registrationNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Capacity</span>
                                    <span className="font-semibold text-slate-800">{selectedVehicle.seatingCapacity} seats</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Fuel Efficiency</span>
                                    <span className="font-semibold text-slate-800">{selectedVehicle.fuelEfficiency} km/L</span>
                                </div>
                            </div>
                            {selectedVehicle.ownerId && (
                                <div>
                                    <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Owner / Driver</h4>
                                    <div className="p-3 border border-slate-150 rounded-xl space-y-1 text-xs">
                                        <p className="font-bold text-slate-800 text-sm">{selectedVehicle.ownerId.name}</p>
                                        <p className="text-slate-500">{selectedVehicle.ownerId.email}</p>
                                        <p className="text-slate-500">📞 {selectedVehicle.ownerId.phone}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Add Vehicle */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-slate-800 text-lg">Register Vehicle</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-450 hover:text-slate-600 text-xl leading-none">×</button>
                        </div>
                        {modalError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                {modalError}
                            </div>
                        )}
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Select Employee Owner</label>
                                <select
                                    required
                                    value={ownerId}
                                    onChange={(e) => setOwnerId(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">-- Choose Employee --</option>
                                    {employees.map((emp) => (
                                        <option key={emp._id} value={emp._id}>
                                            {emp.name} ({emp.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Vehicle Model</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Toyota Prius"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Plate Number</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. MH-12-AB-1234"
                                    value={registrationNumber}
                                    onChange={(e) => setRegistrationNumber(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Seating Capacity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        placeholder="e.g. 5"
                                        value={seatingCapacity}
                                        onChange={(e) => setSeatingCapacity(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Efficiency (km/L)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="1"
                                        required
                                        placeholder="e.g. 18.5"
                                        value={fuelEfficiency}
                                        onChange={(e) => setFuelEfficiency(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                                >
                                    {submitting ? 'Registering...' : 'Register'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminVehicles
