import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'

type BookingStatus = 'Pending' | 'Confirmed' | 'Rejected' | 'Cancelled' | 'Completed'

interface Booking {
    _id: string
    seatsBooked: number
    fareTotal: number
    paymentMethod: string
    status: BookingStatus
    createdAt: string
    rideId: {
        _id: string
        pickupLocation: { address: string }
        destination: { address: string }
        travelDateTime: string
        farePerSeat: number
        driverId: { name: string; phone?: string } | null
        vehicleId: { model: string; registrationNumber: string } | null
    } | null
}

const statusColors: Record<BookingStatus, string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Confirmed: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-600',
    Cancelled: 'bg-slate-100 text-slate-500',
    Completed: 'bg-blue-100 text-blue-600'
}

const MyBookings: React.FC = () => {
    const navigate = useNavigate()
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetch = async () => {
            setLoading(true)
            try {
                const res = await API.get('/bookings')
                setBookings(res.data.data)
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load bookings.')
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [])

    const handleCancel = async (bookingId: string) => {
        if (!window.confirm('Cancel this booking request?')) return
        try {
            await API.put(`/bookings/${bookingId}/status`, { status: 'Cancelled' })
            setBookings((prev) =>
                prev.map((b) => (b._id === bookingId ? { ...b, status: 'Cancelled' } : b))
            )
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to cancel booking.')
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-slate-500 hover:text-slate-700 text-sm font-semibold flex items-center gap-1"
                    >
                        <span>←</span> Dashboard
                    </button>
                    <span className="text-slate-300">|</span>
                    <span className="font-bold text-lg text-blue-900">My Bookings</span>
                </div>
            </header>

            <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-8">
                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                        <h3 className="font-bold text-slate-700 text-lg">No Bookings Yet</h3>
                        <p className="text-slate-400 text-sm mt-1 mb-6">
                            Browse available rides and book your first seat.
                        </p>
                        <button
                            onClick={() => navigate('/find-ride')}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                        >
                            Find a Ride
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((booking) => (
                            <div key={booking._id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                                {/* Status header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Booking ID</p>
                                        <p className="font-mono text-xs text-slate-500 mt-0.5">{booking._id.slice(-8).toUpperCase()}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[booking.status]}`}>
                                        {booking.status}
                                    </span>
                                </div>

                                {/* Ride Route */}
                                {booking.rideId && (
                                    <div className="space-y-1.5 mb-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                                            <span className="font-medium text-slate-700 truncate">
                                                {booking.rideId.pickupLocation.address}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
                                            <span className="font-medium text-slate-700 truncate">
                                                {booking.rideId.destination.address}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Details Grid */}
                                <div className="grid grid-cols-3 gap-3 py-3 border-t border-b border-slate-100 text-center text-sm mb-4">
                                    <div>
                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Departure</p>
                                        <p className="font-semibold text-slate-700 mt-1 text-xs leading-snug">
                                            {booking.rideId
                                                ? new Date(booking.rideId.travelDateTime).toLocaleString()
                                                : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Seats</p>
                                        <p className="font-bold text-slate-800 mt-1">{booking.seatsBooked}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Total Fare</p>
                                        <p className="font-bold text-blue-600 mt-1">${booking.fareTotal}</p>
                                    </div>
                                </div>

                                {/* Driver info row */}
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-slate-500 space-y-0.5">
                                        {booking.rideId?.driverId && (
                                            <p>Driver: <span className="font-semibold text-slate-700">{booking.rideId.driverId.name}</span></p>
                                        )}
                                        {booking.rideId?.vehicleId && (
                                            <p>Vehicle: <span className="font-semibold text-slate-700">{booking.rideId.vehicleId.model}</span>
                                                <span className="font-mono ml-1 text-slate-400">({booking.rideId.vehicleId.registrationNumber})</span>
                                            </p>
                                        )}
                                        <p>Payment: <span className="font-semibold text-slate-700">{booking.paymentMethod}</span></p>
                                    </div>

                                    {/* Cancel action for pending bookings */}
                                    {booking.status === 'Pending' && (
                                        <button
                                            onClick={() => handleCancel(booking._id)}
                                            className="text-xs px-3 py-1.5 border border-red-100 text-red-500 hover:bg-red-50 font-semibold rounded-lg transition-colors"
                                        >
                                            Cancel Request
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

export default MyBookings
