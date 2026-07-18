import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'

type BookingStatus = 'Pending' | 'Confirmed' | 'Rejected' | 'Cancelled' | 'Completed'

interface DriverBooking {
    _id: string
    seatsBooked: number
    fareTotal: number
    paymentMethod: string
    status: BookingStatus
    createdAt: string
    passengerId: { name: string; email: string; phone?: string } | null
    rideId: {
        _id: string
        pickupLocation: { address: string }
        destination: { address: string }
        travelDateTime: string
        farePerSeat: number
    } | null
}

interface MyRide {
    _id: string
    pickupLocation: { address: string }
    destination: { address: string }
    travelDateTime: string
    availableSeats: number
    totalSeats: number
    farePerSeat: number
    status: string
}

const statusColors: Record<BookingStatus, string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Confirmed: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-600',
    Cancelled: 'bg-slate-100 text-slate-500',
    Completed: 'bg-blue-100 text-blue-600'
}

const DriverDashboard: React.FC = () => {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<'requests' | 'rides'>('requests')
    const [bookings, setBookings] = useState<DriverBooking[]>([])
    const [myRides, setMyRides] = useState<MyRide[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const fetchBookings = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await API.get('/bookings/driver')
            setBookings(res.data.data)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load booking requests.')
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchMyRides = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await API.get('/rides/my')
            setMyRides(res.data.data)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load your rides.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (activeTab === 'requests') {
            fetchBookings()
        } else {
            fetchMyRides()
        }
    }, [activeTab, fetchBookings, fetchMyRides])

    const handleUpdateBooking = async (bookingId: string, status: 'Confirmed' | 'Rejected') => {
        setError('')
        setMessage('')
        try {
            await API.put(`/bookings/${bookingId}/status`, { status })
            setBookings((prev) =>
                prev.map((b) => (b._id === bookingId ? { ...b, status } : b))
            )
            setMessage(`Booking ${status.toLowerCase()} successfully.`)
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to ${status.toLowerCase()} booking.`)
        }
    }

    const handleCancelRide = async (rideId: string) => {
        if (!window.confirm('Cancel this ride offer? This cannot be undone.')) return
        setError('')
        setMessage('')
        try {
            await API.put(`/rides/${rideId}/status`, { status: 'Cancelled' })
            setMyRides((prev) =>
                prev.map((r) => (r._id === rideId ? { ...r, status: 'Cancelled' } : r))
            )
            setMessage('Ride cancelled successfully.')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to cancel ride.')
        }
    }

    const handleStartTrip = (rideId: string) => {
        navigate(`/live-ride/${rideId}`)
    }

    const pendingCount = bookings.filter((b) => b.status === 'Pending').length

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
                    <span className="font-bold text-lg text-blue-900">Driver Dashboard</span>
                </div>
                <button
                    onClick={() => navigate('/offer-ride')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                    + Offer New Ride
                </button>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b border-slate-100 px-6">
                <div className="max-w-4xl mx-auto flex gap-6">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`pb-3 pt-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'requests'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Booking Requests
                        {pendingCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('rides')}
                        className={`pb-3 pt-4 text-sm font-semibold border-b-2 transition-colors ${
                            activeTab === 'rides'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        My Ride Offers
                    </button>
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
                    <div className="flex justify-center items-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* Booking Requests Tab */}
                        {activeTab === 'requests' && (
                            <div className="space-y-4">
                                {bookings.length === 0 ? (
                                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
                                        <h3 className="font-bold text-slate-700 text-lg">No Booking Requests</h3>
                                        <p className="text-slate-400 text-sm mt-1">
                                            Booking requests from your coworkers will appear here once you publish rides.
                                        </p>
                                    </div>
                                ) : (
                                    bookings.map((booking) => (
                                        <div key={booking._id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div>
                                                    <p className="font-bold text-slate-800">{booking.passengerId?.name ?? 'Unknown Passenger'}</p>
                                                    <p className="text-xs text-slate-400">{booking.passengerId?.email}</p>
                                                    {booking.passengerId?.phone && (
                                                        <p className="text-xs text-slate-400">{booking.passengerId.phone}</p>
                                                    )}
                                                </div>
                                                <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${statusColors[booking.status]}`}>
                                                    {booking.status}
                                                </span>
                                            </div>

                                            {/* Ride route */}
                                            {booking.rideId && (
                                                <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-1 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                        <span className="text-slate-600 truncate">{booking.rideId.pickupLocation.address}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                        <span className="text-slate-600 truncate">{booking.rideId.destination.address}</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-3 gap-3 text-center text-sm mb-4 pb-4 border-b border-slate-100">
                                                <div>
                                                    <p className="text-xs text-slate-400 font-semibold uppercase">Seats</p>
                                                    <p className="font-bold text-slate-800 mt-1">{booking.seatsBooked}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-semibold uppercase">Fare</p>
                                                    <p className="font-bold text-blue-600 mt-1">${booking.fareTotal}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-semibold uppercase">Payment</p>
                                                    <p className="font-bold text-slate-800 mt-1">{booking.paymentMethod}</p>
                                                </div>
                                            </div>

                                            {/* Action buttons for Pending bookings */}
                                            {booking.status === 'Pending' && (
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleUpdateBooking(booking._id, 'Confirmed')}
                                                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateBooking(booking._id, 'Rejected')}
                                                        className="flex-1 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-lg transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* My Ride Offers Tab */}
                        {activeTab === 'rides' && (
                            <div className="space-y-4">
                                {myRides.length === 0 ? (
                                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
                                        <h3 className="font-bold text-slate-700 text-lg">No Ride Offers Published</h3>
                                        <p className="text-slate-400 text-sm mt-1 mb-6">
                                            Create a ride offer to start sharing your commute with colleagues.
                                        </p>
                                        <button
                                            onClick={() => navigate('/offer-ride')}
                                            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                                        >
                                            Offer a Ride
                                        </button>
                                    </div>
                                ) : (
                                    myRides.map((ride) => (
                                        <div key={ride._id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                                                        <span className="font-medium text-slate-700 truncate">
                                                            {ride.pickupLocation.address}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
                                                        <span className="font-medium text-slate-700 truncate">
                                                            {ride.destination.address}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ml-3 flex-shrink-0 ${
                                                    ride.status === 'Active'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {ride.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3 text-center text-sm py-3 border-t border-b border-slate-100 mb-4">
                                                <div>
                                                    <p className="text-xs text-slate-400 font-semibold uppercase">Departure</p>
                                                    <p className="font-semibold text-slate-700 mt-1 text-xs leading-snug">
                                                        {new Date(ride.travelDateTime).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-semibold uppercase">Seats Left</p>
                                                    <p className="font-bold text-blue-600 mt-1">{ride.availableSeats}/{ride.totalSeats}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-semibold uppercase">Fare/Seat</p>
                                                    <p className="font-bold text-slate-800 mt-1">${ride.farePerSeat}</p>
                                                </div>
                                            </div>

                                            {ride.status === 'Active' && (
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleStartTrip(ride._id)}
                                                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                                                    >
                                                        🚀 Start / Track Trip
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelRide(ride._id)}
                                                        className="flex-1 py-2 border border-red-200 text-red-500 hover:bg-red-50 text-sm font-semibold rounded-lg transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                            {ride.status === 'Completed' && (
                                                <div className="py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 text-center font-semibold">
                                                    ✓ Completed — Earnings credited to wallet
                                                </div>
                                            )}
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

export default DriverDashboard
