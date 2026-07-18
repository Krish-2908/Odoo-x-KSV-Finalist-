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

const OfferRide: React.FC = () => {
    const navigate = useNavigate()
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [loadingVehicles, setLoadingVehicles] = useState(true)

    // Form inputs
    const [vehicleId, setVehicleId] = useState('')
    const [pickupAddress, setPickupAddress] = useState('')
    const [destAddress, setDestAddress] = useState('')
    const [travelDateTime, setTravelDateTime] = useState('')
    const [availableSeats, setAvailableSeats] = useState(1)
    const [farePerSeat, setFarePerSeat] = useState(10)

    // Route confirmation states
    const [isRouteConfirmed, setIsRouteConfirmed] = useState(false)
    const [calculatingRoute, setCalculatingRoute] = useState(false)
    const [routeDistance, setRouteDistance] = useState(0)
    const [recommendedFare, setRecommendedFare] = useState(0)

    // Form submission states
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const res = await API.get('/vehicles')
                setVehicles(res.data.data)
                if (res.data.data.length > 0) {
                    setVehicleId(res.data.data[0]._id)
                }
            } catch (err) {
                console.error('Failed to load user vehicles:', err)
            } finally {
                setLoadingVehicles(false)
            }
        };

        fetchVehicles()
    }, [])

    const handleCalculateRoute = (e: React.MouseEvent) => {
        e.preventDefault()
        if (!pickupAddress || !destAddress) {
            setError('Please specify both pickup and destination addresses.')
            return
        }

        setError('')
        setCalculatingRoute(true)

        // Simulate local route calculation
        setTimeout(() => {
            const distance = Math.floor(Math.random() * 20) + 5 // 5 to 25 km
            setRouteDistance(distance)
            // Simulating fuel settings calculations: say $0.5 or $1.0 per km
            setRecommendedFare(distance * 2) 
            setFarePerSeat(distance * 2)
            setIsRouteConfirmed(true)
            setCalculatingRoute(false)
        }, 1500)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isRouteConfirmed) {
            setError('Please confirm your route first.')
            return
        }

        setError('')
        setMessage('')
        setSubmitting(true)

        try {
            await API.post('/rides', {
                vehicleId,
                pickupLocation: {
                    address: pickupAddress,
                    coordinates: [72.5714, 23.0225] // Local coordinate mock [lng, lat]
                },
                destination: {
                    address: destAddress,
                    coordinates: [72.5856, 23.0338] // Local coordinate mock [lng, lat]
                },
                travelDateTime,
                availableSeats,
                farePerSeat,
                recurring: {
                    isRecurring: false,
                    days: []
                }
            })

            setMessage('Ride offered and published successfully!')
            setTimeout(() => {
                navigate('/dashboard')
            }, 2000)
        } catch (err: any) {
            console.error(err)
            setError(err.response?.data?.message || 'Failed to publish ride.')
        } finally {
            setSubmitting(false)
        }
    }

    const selectedVehicleObj = vehicles.find((v) => v._id === vehicleId)

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
                    <span className="font-bold text-lg text-blue-900">Offer a Ride</span>
                </div>
            </header>

            {/* Content Container */}
            <main className="flex-1 max-w-2xl w-full mx-auto p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-extrabold text-slate-800">Publish a Ride Offer</h1>
                    <p className="text-sm text-slate-500">Commute with fellow employees and share the fuel costs.</p>
                </div>

                {loadingVehicles ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : vehicles.length === 0 ? (
                    /* Warning if no vehicles registered */
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                        <span className="text-4xl block mb-3">⚠️</span>
                        <h3 className="font-bold text-slate-700 text-lg">No Registered Vehicles Found</h3>
                        <p className="text-slate-500 text-sm mt-1 mb-6">
                            You must register at least one vehicle in your profile settings before you can publish a ride offer.
                        </p>
                        <button
                            onClick={() => navigate('/vehicles')}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                        >
                            Register a Vehicle Now
                        </button>
                    </div>
                ) : (
                    /* Main Form */
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
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

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Vehicle Select */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                    Select Vehicle
                                </label>
                                <select
                                    value={vehicleId}
                                    onChange={(e) => {
                                        setVehicleId(e.target.value)
                                        setIsRouteConfirmed(false)
                                    }}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 text-sm"
                                >
                                    {vehicles.map((v) => (
                                        <option key={v._id} value={v._id}>
                                            {v.model} ({v.registrationNumber}) - Capacity: {v.seatingCapacity} seats
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Addresses */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                        Pickup Address
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={pickupAddress}
                                        onChange={(e) => {
                                            setPickupAddress(e.target.value)
                                            setIsRouteConfirmed(false)
                                        }}
                                        placeholder="e.g. Satellite Road, Ahmedabad"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                        Destination Address
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={destAddress}
                                        onChange={(e) => {
                                            setDestAddress(e.target.value)
                                            setIsRouteConfirmed(false)
                                        }}
                                        placeholder="e.g. Odoo House, Gift City"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Route Confirmation Trigger */}
                            {!isRouteConfirmed && (
                                <button
                                    onClick={handleCalculateRoute}
                                    disabled={calculatingRoute}
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                                >
                                    {calculatingRoute ? 'Calculating Route Details...' : 'Verify Route & Calculate Fare'}
                                </button>
                            )}

                            {/* Confirmed Route info */}
                            {isRouteConfirmed && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-sm text-slate-700 animate-fade-in">
                                    <h4 className="font-bold text-blue-900">Route Details Confirmed</h4>
                                    <p>🛣️ Estimated Distance: <span className="font-bold text-slate-800">{routeDistance} km</span></p>
                                    <p>💵 Recommended Fare: <span className="font-bold text-slate-800">${recommendedFare}</span></p>
                                </div>
                            )}

                            {/* Datetime & Fare */}
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                        Departure Date & Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={travelDateTime}
                                        onChange={(e) => setTravelDateTime(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                        Offered Seats
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max={selectedVehicleObj?.seatingCapacity || 4}
                                        value={availableSeats}
                                        onChange={(e) => setAvailableSeats(Math.min(parseInt(e.target.value) || 1, selectedVehicleObj?.seatingCapacity || 4))}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 text-sm"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Max capacity: {selectedVehicleObj?.seatingCapacity || 4}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                    Fare Price (per Seat)
                                </label>
                                <div className="flex gap-2 items-center max-w-xs">
                                    <span className="text-slate-500 text-sm font-bold">$</span>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={farePerSeat}
                                        onChange={(e) => setFarePerSeat(parseFloat(e.target.value) || 0)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !isRouteConfirmed}
                                className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm mt-6"
                            >
                                {submitting ? 'Publishing Ride...' : 'Publish Ride Offer'}
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    )
}

export default OfferRide
