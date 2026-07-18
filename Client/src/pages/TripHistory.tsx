import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'

type TabType = 'stats' | 'driver' | 'passenger'

interface Stats {
    driver: {
        totalRidesOffered: number
        completedRides: number
        cancelledRides: number
        totalEarnings: number
        totalPassengersCarried: number
    }
    passenger: {
        totalRidesBooked: number
        completedBookings: number
        cancelledBookings: number
        totalSpent: number
    }
}

interface DriverTrip {
    ride: {
        _id: string
        pickupLocation: { address: string }
        destination: { address: string }
        travelDateTime: string
        status: string
        totalSeats: number
        availableSeats: number
        farePerSeat: number
        vehicleId: { model: string; registrationNumber: string } | null
    }
    bookings: {
        _id: string
        status: string
        seatsBooked: number
        fareTotal: number
        paymentMethod: string
        passengerId: { name: string; email: string } | null
    }[]
}

interface PassengerTrip {
    _id: string
    status: string
    seatsBooked: number
    fareTotal: number
    paymentMethod: string
    createdAt: string
    rideId: {
        _id: string
        pickupLocation: { address: string }
        destination: { address: string }
        travelDateTime: string
        status: string
        driverId: { name: string; email: string } | null
        vehicleId: { model: string; registrationNumber: string } | null
    } | null
}

const statusBadge = (status: string) => {
    const map: Record<string, string> = {
        Active: 'bg-green-100 text-green-700',
        Completed: 'bg-blue-100 text-blue-700',
        Cancelled: 'bg-slate-100 text-slate-500',
        Confirmed: 'bg-emerald-100 text-emerald-700',
        Rejected: 'bg-red-100 text-red-500',
        Pending: 'bg-yellow-100 text-yellow-700'
    }
    return map[status] ?? 'bg-slate-100 text-slate-500'
}

const TripHistory: React.FC = () => {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<TabType>('stats')
    const [stats, setStats] = useState<Stats | null>(null)
    const [driverTrips, setDriverTrips] = useState<DriverTrip[]>([])
    const [passengerTrips, setPassengerTrips] = useState<PassengerTrip[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [completing, setCompleting] = useState<string | null>(null)

    const fetchStats = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await API.get('/trips/stats')
            setStats(res.data.data)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load stats.')
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchDriverTrips = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await API.get('/trips/driver')
            setDriverTrips(res.data.data.trips)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load driver trips.')
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchPassengerTrips = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await API.get('/trips/passenger')
            setPassengerTrips(res.data.data.trips)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load passenger trips.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (activeTab === 'stats') fetchStats()
        else if (activeTab === 'driver') fetchDriverTrips()
        else fetchPassengerTrips()
    }, [activeTab, fetchStats, fetchDriverTrips, fetchPassengerTrips])

    const handleComplete = async (rideId: string) => {
        if (!window.confirm('Mark this ride as completed? This will credit earnings to your wallet.')) return
        setError('')
        setMessage('')
        setCompleting(rideId)
        try {
            const res = await API.post(`/trips/${rideId}/complete`)
            setMessage(res.data.message || 'Ride completed successfully.')
            fetchDriverTrips()
            fetchStats()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to complete ride.')
        } finally {
            setCompleting(null)
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
                    <span className="font-bold text-lg text-blue-900">Trip History</span>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b border-slate-100 px-6">
                <div className="max-w-4xl mx-auto flex gap-6">
                    {(['stats', 'driver', 'passenger'] as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setError(''); setMessage('') }}
                            className={`pb-3 pt-4 text-sm font-semibold border-b-2 transition-colors capitalize ${
                                activeTab === tab
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab === 'stats' ? 'My Stats' : tab === 'driver' ? 'As Driver' : 'As Passenger'}
                        </button>
                    ))}
                </div>
            </div>

            <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8">
                {message && (
                    <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* ── STATS TAB ── */}
                        {activeTab === 'stats' && stats && (
                            <div className="space-y-6">
                                {/* Driver Stats */}
                                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 bg-green-50 border-b border-slate-100">
                                        <h3 className="font-bold text-slate-800">As a Driver</h3>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-slate-100">
                                        {[
                                            { label: 'Rides Offered', value: stats.driver.totalRidesOffered },
                                            { label: 'Completed', value: stats.driver.completedRides },
                                            { label: 'Cancelled', value: stats.driver.cancelledRides },
                                            { label: 'Passengers Carried', value: stats.driver.totalPassengersCarried },
                                            { label: 'Total Earnings', value: `$${stats.driver.totalEarnings.toFixed(2)}` }
                                        ].map(({ label, value }) => (
                                            <div key={label} className="p-5 text-center">
                                                <p className="text-2xl font-extrabold text-slate-800">{value}</p>
                                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mt-1">{label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Passenger Stats */}
                                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 bg-blue-50 border-b border-slate-100">
                                        <h3 className="font-bold text-slate-800">As a Passenger</h3>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100">
                                        {[
                                            { label: 'Rides Booked', value: stats.passenger.totalRidesBooked },
                                            { label: 'Completed', value: stats.passenger.completedBookings },
                                            { label: 'Cancelled / Rejected', value: stats.passenger.cancelledBookings },
                                            { label: 'Total Spent', value: `$${stats.passenger.totalSpent.toFixed(2)}` }
                                        ].map(({ label, value }) => (
                                            <div key={label} className="p-5 text-center">
                                                <p className="text-2xl font-extrabold text-slate-800">{value}</p>
                                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mt-1">{label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── DRIVER TAB ── */}
                        {activeTab === 'driver' && (
                            <div className="space-y-5">
                                {driverTrips.length === 0 ? (
                                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
                                        <h3 className="font-bold text-slate-700 text-lg">No Rides Yet</h3>
                                        <p className="text-slate-400 text-sm mt-1 mb-6">
                                            Your published ride history will appear here.
                                        </p>
                                        <button
                                            onClick={() => navigate('/offer-ride')}
                                            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                                        >
                                            Offer a Ride
                                        </button>
                                    </div>
                                ) : (
                                    driverTrips.map(({ ride, bookings }) => (
                                        <div key={ride._id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                            {/* Ride header */}
                                            <div className="p-5 flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0 space-y-1.5">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                                                        <span className="font-medium text-slate-700 truncate">{ride.pickupLocation.address}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
                                                        <span className="font-medium text-slate-700 truncate">{ride.destination.address}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 pt-1">
                                                        {new Date(ride.travelDateTime).toLocaleString()}
                                                        {ride.vehicleId && ` · ${ride.vehicleId.model} (${ride.vehicleId.registrationNumber})`}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(ride.status)}`}>
                                                        {ride.status}
                                                    </span>
                                                    <p className="text-xs text-slate-400">${ride.farePerSeat}/seat</p>
                                                    {ride.status === 'Active' && (
                                                        <button
                                                            onClick={() => handleComplete(ride._id)}
                                                            disabled={completing === ride._id}
                                                            className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
                                                        >
                                                            {completing === ride._id ? 'Completing...' : 'Mark Complete'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bookings for this ride */}
                                            {bookings.length > 0 && (
                                                <div className="border-t border-slate-100">
                                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide px-5 py-2">
                                                        Passengers ({bookings.length})
                                                    </p>
                                                    <div className="divide-y divide-slate-50">
                                                        {bookings.map((b) => (
                                                            <div key={b._id} className="flex items-center justify-between px-5 py-3 text-sm">
                                                                <div>
                                                                    <p className="font-semibold text-slate-700">{b.passengerId?.name ?? '—'}</p>
                                                                    <p className="text-xs text-slate-400">{b.passengerId?.email} · {b.seatsBooked} seat(s) · {b.paymentMethod}</p>
                                                                </div>
                                                                <div className="text-right flex-shrink-0 ml-4">
                                                                    <p className="font-bold text-slate-800">${b.fareTotal}</p>
                                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge(b.status)}`}>
                                                                        {b.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* ── PASSENGER TAB ── */}
                        {activeTab === 'passenger' && (
                            <div className="space-y-4">
                                {passengerTrips.length === 0 ? (
                                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
                                        <h3 className="font-bold text-slate-700 text-lg">No Trip History</h3>
                                        <p className="text-slate-400 text-sm mt-1 mb-6">
                                            Your completed and past bookings will appear here.
                                        </p>
                                        <button
                                            onClick={() => navigate('/find-ride')}
                                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                                        >
                                            Find a Ride
                                        </button>
                                    </div>
                                ) : (
                                    passengerTrips.map((trip) => (
                                        <div key={trip._id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                                                        <span className="font-medium text-slate-700 truncate">
                                                            {trip.rideId?.pickupLocation.address ?? '—'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
                                                        <span className="font-medium text-slate-700 truncate">
                                                            {trip.rideId?.destination.address ?? '—'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${statusBadge(trip.status)}`}>
                                                    {trip.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3 text-center text-sm py-3 border-t border-b border-slate-100 mb-3">
                                                <div>
                                                    <p className="text-xs text-slate-400 font-semibold uppercase">Departure</p>
                                                    <p className="font-semibold text-slate-700 mt-1 text-xs leading-snug">
                                                        {trip.rideId ? new Date(trip.rideId.travelDateTime).toLocaleString() : '—'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-semibold uppercase">Seats</p>
                                                    <p className="font-bold text-slate-800 mt-1">{trip.seatsBooked}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-semibold uppercase">Fare</p>
                                                    <p className="font-bold text-blue-600 mt-1">${trip.fareTotal}</p>
                                                </div>
                                            </div>

                                            <div className="text-xs text-slate-500 space-y-0.5">
                                                {trip.rideId?.driverId && (
                                                    <p>Driver: <span className="font-semibold text-slate-700">{trip.rideId.driverId.name}</span></p>
                                                )}
                                                {trip.rideId?.vehicleId && (
                                                    <p>Vehicle: <span className="font-semibold text-slate-700">{trip.rideId.vehicleId.model}</span>
                                                        <span className="font-mono ml-1 text-slate-400">({trip.rideId.vehicleId.registrationNumber})</span>
                                                    </p>
                                                )}
                                                <p>Payment: <span className="font-semibold text-slate-700">{trip.paymentMethod}</span></p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

export default TripHistory
