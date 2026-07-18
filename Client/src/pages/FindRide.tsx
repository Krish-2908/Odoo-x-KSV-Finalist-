import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'

interface Ride {
    _id: string
    pickupLocation: { address: string }
    destination: { address: string }
    travelDateTime: string
    availableSeats: number
    farePerSeat: number
    status: string
    driverId: {
        name: string
        email: string
        phone?: string
    } | null
    vehicleId: {
        model: string
        registrationNumber: string
    } | null
}

const FindRide: React.FC = () => {
    const navigate = useNavigate()
    const [rides, setRides] = useState<Ride[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Filters
    const [filterDate, setFilterDate] = useState('')
    const [filterSeats, setFilterSeats] = useState(1)

    const fetchRides = async () => {
        setLoading(true)
        setError('')
        try {
            const params: Record<string, string> = {}
            if (filterDate) params.date = filterDate
            if (filterSeats) params.seatsRequired = String(filterSeats)
            const res = await API.get('/rides', { params })
            setRides(res.data.data)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load available rides.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRides()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
                    <span className="font-bold text-lg text-blue-900">Find a Ride</span>
                </div>
            </header>

            {/* Search Filters */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 shadow-sm">
                <div className="max-w-4xl mx-auto flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Travel Date
                        </label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Seats Required
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={filterSeats}
                            onChange={(e) => setFilterSeats(parseInt(e.target.value) || 1)}
                            className="w-20 px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={fetchRides}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                    >
                        Search Rides
                    </button>
                </div>
            </div>

            {/* Results */}
            <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8">
                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : rides.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                        <span className="text-4xl block mb-3">🔍</span>
                        <h3 className="font-bold text-slate-700 text-lg">No Rides Available</h3>
                        <p className="text-slate-400 text-sm mt-1">
                            No active rides match your filters. Try changing the date or seats filter above.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {rides.map((ride) => (
                            <div
                                key={ride._id}
                                onClick={() => navigate(`/rides/${ride._id}`)}
                                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    {/* Route Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                                            <span className="text-sm font-semibold text-slate-800 truncate">
                                                {ride.pickupLocation.address}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
                                            <span className="text-sm font-semibold text-slate-800 truncate">
                                                {ride.destination.address}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                                            <span>🗓️ {new Date(ride.travelDateTime).toLocaleString()}</span>
                                            <span>👤 {ride.driverId?.name ?? 'Unknown Driver'}</span>
                                            {ride.vehicleId && (
                                                <span>{ride.vehicleId.model} ({ride.vehicleId.registrationNumber})</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Fare & Seats */}
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xl font-extrabold text-blue-600">${ride.farePerSeat}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">per seat</p>
                                        <div className="mt-2 inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                                            <span>💺</span>
                                            <span>{ride.availableSeats} available</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-end">
                                    <span className="text-xs text-blue-600 font-semibold group-hover:underline">
                                        View details & book →
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

export default FindRide
