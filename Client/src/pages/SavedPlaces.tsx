import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'

interface SavedPlace {
    _id: string
    label: string
    address: string
    coordinates: { lat: number; lng: number }
    createdAt: string
}

interface PlaceForm {
    label: string
    address: string
    lat: string
    lng: string
}

const LABEL_PRESETS = ['Home', 'Office', 'Gym', 'School', 'Hospital', 'Other']

const emptyForm: PlaceForm = { label: '', address: '', lat: '', lng: '' }

const SavedPlaces: React.FC = () => {
    const navigate = useNavigate()
    const [places, setPlaces] = useState<SavedPlace[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState<PlaceForm>(emptyForm)
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState('')
    const [customLabel, setCustomLabel] = useState(false)

    const fetchPlaces = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await API.get('/saved-places')
            setPlaces(res.data.data)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load saved places.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPlaces()
    }, [fetchPlaces])

    const openAdd = () => {
        setEditingId(null)
        setForm(emptyForm)
        setCustomLabel(false)
        setFormError('')
        setShowModal(true)
    }

    const openEdit = (place: SavedPlace) => {
        setEditingId(place._id)
        setForm({ label: place.label, address: place.address, lat: String(place.coordinates.lat), lng: String(place.coordinates.lng) })
        setCustomLabel(!LABEL_PRESETS.includes(place.label))
        setFormError('')
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingId(null)
        setForm(emptyForm)
        setFormError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError('')
        const lat = parseFloat(form.lat)
        const lng = parseFloat(form.lng)
        if (!form.label.trim() || !form.address.trim()) {
            setFormError('Label and address are required.')
            return
        }
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            setFormError('Please enter valid latitude (−90 to 90) and longitude (−180 to 180).')
            return
        }
        setSubmitting(true)
        try {
            const payload = { label: form.label.trim(), address: form.address.trim(), coordinates: { lat, lng } }
            if (editingId) {
                await API.put(`/saved-places/${editingId}`, payload)
                setMessage('Saved place updated.')
            } else {
                await API.post('/saved-places', payload)
                setMessage('Saved place added.')
            }
            closeModal()
            await fetchPlaces()
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to save place.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string, label: string) => {
        if (!window.confirm(`Delete "${label}" from your saved places?`)) return
        setError('')
        setMessage('')
        try {
            await API.delete(`/saved-places/${id}`)
            setPlaces((prev) => prev.filter((p) => p._id !== id))
            setMessage(`"${label}" deleted.`)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete saved place.')
        }
    }

    // Label icon map
    const labelIcon: Record<string, string> = {
        Home: '🏠', Office: '🏢', Gym: '💪', School: '🎓', Hospital: '🏥'
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
                    <span className="font-bold text-lg text-blue-900">Saved Places</span>
                </div>
                <button
                    onClick={openAdd}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                    + Add Place
                </button>
            </header>

            <main className="flex-1 max-w-2xl w-full mx-auto p-6 md:p-8">
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
                ) : places.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                        <h3 className="font-bold text-slate-700 text-lg">No Saved Places</h3>
                        <p className="text-slate-400 text-sm mt-1 mb-6">
                            Save your favourite locations like Home and Office for quick access when creating rides.
                        </p>
                        <button
                            onClick={openAdd}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                        >
                            Add Your First Place
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {places.map((place) => (
                            <div key={place._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-start gap-4 group hover:border-blue-200 transition-colors">
                                {/* Icon */}
                                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">
                                    {labelIcon[place.label] ?? '📍'}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800">{place.label}</p>
                                    <p className="text-sm text-slate-500 mt-0.5 truncate">{place.address}</p>
                                    <p className="text-xs text-slate-400 mt-1 font-mono">
                                        {place.coordinates.lat.toFixed(5)}, {place.coordinates.lng.toFixed(5)}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => openEdit(place)}
                                        className="text-xs px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-lg transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(place._id, place.label)}
                                        className="text-xs px-3 py-1.5 border border-red-100 text-red-500 hover:bg-red-50 font-semibold rounded-lg transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-slate-800 text-lg">
                                {editingId ? 'Edit Saved Place' : 'Add New Saved Place'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        {formError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Label preset chips */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                    Label
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {LABEL_PRESETS.map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => { setForm((f) => ({ ...f, label: preset })); setCustomLabel(false) }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                                form.label === preset && !customLabel
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                            }`}
                                        >
                                            {labelIcon[preset] ?? '📍'} {preset}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => { setCustomLabel(true); setForm((f) => ({ ...f, label: '' })) }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                            customLabel
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                        }`}
                                    >
                                        Custom
                                    </button>
                                </div>
                                {customLabel && (
                                    <input
                                        type="text"
                                        placeholder="e.g. Friend's House"
                                        value={form.label}
                                        onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                )}
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                    Full Address
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="123 Main St, City, State"
                                    value={form.address}
                                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Coordinates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                        Latitude
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        placeholder="e.g. 28.6139"
                                        value={form.lat}
                                        onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                        Longitude
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        placeholder="e.g. 77.2090"
                                        value={form.lng}
                                        onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-slate-400">
                                Tip: Right-click any location on Google Maps and copy the coordinates shown.
                            </p>

                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                                >
                                    {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Add Place'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SavedPlaces
