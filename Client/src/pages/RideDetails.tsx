import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../services/api'

interface RideDetail {
    _id: string
    pickupLocation: { address: string }
    destination: { address: string }
    travelDateTime: string
    availableSeats: number
    totalSeats: number
    farePerSeat: number
    status: string
    driverId: {
        _id: string
        name: string
        email: string
        phone?: string
    } | null
    vehicleId: {
        model: string
        registrationNumber: string
        seatingCapacity: number
    } | null
}

const RideDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [ride, setRide] = useState<RideDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    // Booking form state
    const [seatsBooked, setSeatsBooked] = useState(1)
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Wallet'>('Cash')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const fetchRide = async () => {
            setLoading(true)
            setError('')
            try {
                const res = await API.get(`/rides/${id}`)
                setRide(res.data.data)
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load ride details.')
            } finally {
                setLoading(false)
            }
        }
        fetchRide()
    }, [id])

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setMessage('')
        setSubmitting(true)
        try {
            await API.post('/bookings', {
                rideId: id,
                seatsBooked,
                paymentMethod
            })
            setMessage('Booking request sent! Awaiting driver confirmation.')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit booking request.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen bg-slate-50 items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (error && !ride) {
        return (
            <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-sm">
                    <span className="text-4xl block mb-3">⚠️</span>
                    <p className="text-slate-700 font-semibold mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/find-ride')}
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"
                    >
                        Back to Search
                    </button>
                </div>
            </div>
        )
    }

    const isDriver = ride?.driverId?._id === user?._id
    const canBook = ride?.status === 'Active' && !isDriver && (ride?.availableSeats ?? 0) > 0

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/find-ride')}
                        className="text-slate-500 hover:text-slate-700 text-sm font-semibold flex items-center gap-1"
                    >
                        <span>←</span> Search Results
                    </button>
                    <span className="text-slate-300">|</span>
                    <span className="font-bold text-lg text-blue-900">Ride Details</span>
                </div>
            </header>

            <main className="flex-1 max-w-2xl w-full mx-auto p-6 md:p-8 space-y-6">
                {ride && (
                    <>
                        {/* Ride Summary Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold text-slate-800 text-lg">Ride Summary</h2>
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ride.status === 'Active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {ride.status}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></span>
                                    <div>
                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Pickup</p>
                                        <p className="font-semibold text-slate-800">{ride.pickupLocation.address}</p>
                                    </div>
                                </div>
                                <div className="w-px h-4 bg-slate-200 ml-1.5"></div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"></span>
                                    <div>
                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Destination</p>
                                        <p className="font-semibold text-slate-800">{ride.destination.address}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-center">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Departure</p>
                                    <p className="font-bold text-slate-800 text-sm mt-1">
                                        {new Date(ride.travelDateTime).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Available Seats</p>
                                    <p className="font-bold text-blue-600 text-lg mt-1">{ride.availableSeats}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Fare / Seat</p>
                                    <p className="font-bold text-slate-800 text-lg mt-1">${ride.farePerSeat}</p>
                                </div>
                            </div>
                        </div>

                        {/* Driver & Vehicle Info */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                            <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wide">Driver & Vehicle</h3>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                    {ride.driverId?.name?.[0] ?? '?'}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{ride.driverId?.name ?? 'Unknown'}</p>
                                    <p className="text-xs text-slate-400">{ride.driverId?.email}</p>
                                    {ride.driverId?.phone && (
                                        <p className="text-xs text-slate-400">{ride.driverId.phone}</p>
                                    )}
                                </div>
                            </div>
                            {ride.vehicleId && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                                    <div>
                                        <p className="font-semibold text-slate-700">{ride.vehicleId.model}</p>
                                        <p className="text-xs text-slate-400 font-mono">{ride.vehicleId.registrationNumber}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Booking Form */}
                        {message ? (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-700 text-center font-semibold">
                                ✅ {message}
                            </div>
                        ) : canBook ? (
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                                <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wide">Book a Seat</h3>
                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                        {error}
                                    </div>
                                )}
                                <form onSubmit={handleBook} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                                Seats to Book
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={ride.availableSeats}
                                                value={seatsBooked}
                                                onChange={(e) => setSeatsBooked(Math.min(parseInt(e.target.value) || 1, ride.availableSeats))}
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                                Payment Method
                                            </label>
                                            <select
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value as any)}
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="Cash">Cash</option>
                                                <option value="Card">Card</option>
                                                <option value="UPI">UPI</option>
                                                <option value="Wallet">Wallet</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                        <span className="text-sm text-slate-600 font-semibold">Total Fare</span>
                                        <span className="text-xl font-extrabold text-blue-700">
                                            ${(ride.farePerSeat * seatsBooked).toFixed(2)}
                                        </span>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm"
                                    >
                                        {submitting ? 'Sending Booking Request...' : 'Request Booking'}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-sm text-slate-500">
                                {isDriver
                                    ? "You are the driver of this ride and cannot book a seat."
                                    : ride?.status !== 'Active'
                                        ? "This ride is no longer available for booking."
                                        : "No seats are currently available."}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

export default RideDetails
