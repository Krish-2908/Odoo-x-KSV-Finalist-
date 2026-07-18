import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'

interface Vehicle {
    _id: string
    model: string
    registrationNumber: string
    seatingCapacity: number
    fuelEfficiency: number
}

const Vehicles: React.FC = () => {
    const navigate = useNavigate()
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    // Form modal states
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [model, setModel] = useState('')
    const [registrationNumber, setRegistrationNumber] = useState('')
    const [seatingCapacity, setSeatingCapacity] = useState(4)
    const [fuelEfficiency, setFuelEfficiency] = useState(15)
    const [submitting, setSubmitting] = useState(false)

    const fetchVehicles = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await API.get('/vehicles')
            setVehicles(res.data.data)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load vehicles.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchVehicles()
    }, [])

    const handleOpenAdd = () => {
        setEditingId(null)
        setModel('')
        setRegistrationNumber('')
        setSeatingCapacity(4)
        setFuelEfficiency(15)
        setError('')
        setMessage('')
        setIsModalOpen(true)
    }

    const handleOpenEdit = (v: Vehicle) => {
        setEditingId(v._id)
        setModel(v.model)
        setRegistrationNumber(v.registrationNumber)
        setSeatingCapacity(v.seatingCapacity)
        setFuelEfficiency(v.fuelEfficiency)
        setError('')
        setMessage('')
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setMessage('')
        setSubmitting(true)
        try {
            if (editingId) {
                // Update
                const res = await API.put(`/vehicles/${editingId}`, {
                    model,
                    registrationNumber,
                    seatingCapacity,
                    fuelEfficiency
                })
                setVehicles((prev) =>
                    prev.map((v) => (v._id === editingId ? res.data.data : v))
                )
                setMessage('Vehicle details updated successfully.')
            } else {
                // Create
                const res = await API.post('/vehicles', {
                    model,
                    registrationNumber,
                    seatingCapacity,
                    fuelEfficiency
                })
                setVehicles((prev) => [res.data.data, ...prev])
                setMessage('Vehicle registered successfully.')
            }
            setIsModalOpen(false)
        } catch (err: any) {
            console.error(err)
            setError(err.response?.data?.message || 'Failed to save vehicle details.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (vehicleId: string) => {
        if (!window.confirm('Are you sure you want to delete this vehicle?')) return
        setError('')
        setMessage('')
        try {
            await API.delete(`/vehicles/${vehicleId}`)
            setVehicles((prev) => prev.filter((v) => v._id !== vehicleId))
            setMessage('Vehicle deleted successfully.')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete vehicle.')
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
                    <span className="font-bold text-lg text-blue-900">My Vehicles</span>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                    + Add Vehicle
                </button>
            </header>

            {/* List Content */}
            <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8">
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

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-6">
                        {vehicles.map((v) => (
                            <div key={v._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-slate-800 text-lg leading-snug">{v.model}</h3>
                                        <span className="bg-slate-100 text-slate-600 font-mono text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wider border border-slate-200">
                                            {v.registrationNumber}
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-sm text-slate-500 mb-6">
                                        <p>👥 Capacity: <span className="font-semibold text-slate-700">{v.seatingCapacity} seats</span></p>
                                        <p>⚡ Fuel Efficiency: <span className="font-semibold text-slate-700">{v.fuelEfficiency} km/L</span></p>
                                    </div>
                                </div>
                                <div className="flex gap-3 border-t border-slate-100 pt-4 mt-auto">
                                    <button
                                        onClick={() => handleOpenEdit(v)}
                                        className="flex-1 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-lg text-xs transition-colors"
                                    >
                                        Edit Details
                                    </button>
                                    <button
                                        onClick={() => handleDelete(v._id)}
                                        className="py-1.5 px-3 border border-red-100 hover:bg-red-50 text-red-500 font-semibold rounded-lg text-xs transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                        {vehicles.length === 0 && (
                            <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                                <h3 className="font-bold text-slate-700 text-lg">No Registered Vehicles</h3>
                                <p className="text-slate-400 text-sm mt-1 mb-6">
                                    Register at least one vehicle to start offering rides to colleagues.
                                </p>
                                <button
                                    onClick={handleOpenAdd}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                                >
                                    Add Your First Vehicle
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Add/Edit Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg"
                        >
                            ✕
                        </button>
                        <h3 className="font-bold text-slate-800 text-lg mb-6">
                            {editingId ? 'Edit Vehicle Details' : 'Register New Vehicle'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                    Vehicle Model / Brand
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    placeholder="e.g. Tesla Model 3"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                    Registration Number (License Plate)
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={registrationNumber}
                                    onChange={(e) => setRegistrationNumber(e.target.value)}
                                    placeholder="e.g. GJ-01-XX-1234"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 text-sm font-mono uppercase"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                        Seating Capacity
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="10"
                                        value={seatingCapacity}
                                        onChange={(e) => setSeatingCapacity(parseInt(e.target.value) || 0)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                        Fuel Efficiency (km/L)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={fuelEfficiency}
                                        onChange={(e) => setFuelEfficiency(parseFloat(e.target.value) || 0)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm mt-6"
                            >
                                {submitting ? 'Saving Details...' : 'Save Vehicle'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Vehicles
