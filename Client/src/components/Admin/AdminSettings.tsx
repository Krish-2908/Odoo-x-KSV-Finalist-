import React, { useState } from 'react'
import API from '../../services/api'

interface OrgSettings {
    fuelCostPerKm: number
    fuelCostPerLitre: number
    defaultCarpoolPolicy?: string
    allowedPaymentMethods: ('Cash' | 'Card' | 'UPI' | 'Wallet')[]
}

interface CompanyDetails {
    name: string
    domain: string
    address: string
    industry?: string
    contactInfo?: string
    totalEmployees: number
}

interface AdminSettingsProps {
    settings: OrgSettings
    company: CompanyDetails
    onRefresh: () => void
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ settings, company, onRefresh }) => {
    // States initialized from props
    const [companyName, setCompanyName] = useState(company.name)
    const [companyAddress, setCompanyAddress] = useState(company.address)
    const [companyIndustry, setCompanyIndustry] = useState(company.industry || '')
    const [companyContactInfo, setCompanyContactInfo] = useState(company.contactInfo || '')

    const [fuelCostPerKm, setFuelCostPerKm] = useState(settings.fuelCostPerKm)
    const [fuelCostPerLitre, setFuelCostPerLitre] = useState(settings.fuelCostPerLitre)
    const [defaultCarpoolPolicy, setDefaultCarpoolPolicy] = useState(settings.defaultCarpoolPolicy || '')
    const [allowedMethods, setAllowedMethods] = useState<('Cash' | 'Card' | 'UPI' | 'Wallet')[]>(settings.allowedPaymentMethods)

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleToggleMethod = (method: 'Cash' | 'Card' | 'UPI' | 'Wallet') => {
        setAllowedMethods((prev) => {
            if (prev.includes(method)) {
                return prev.filter((m) => m !== method)
            } else {
                return [...prev, method]
            }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (allowedMethods.length === 0) {
            setError('At least one payment method must be allowed.')
            return
        }

        setSaving(true)
        try {
            await API.put('/admin/settings', {
                fuelCostPerKm,
                fuelCostPerLitre,
                defaultCarpoolPolicy,
                allowedPaymentMethods: allowedMethods,
                companyName,
                companyAddress,
                companyIndustry,
                companyContactInfo
            })
            setSuccess('Configuration and organization settings saved successfully.')
            onRefresh()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update settings.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                    {success}
                </div>
            )}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* 1. Company Profile Details */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-700">Company Details</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Configure organization identity and corporate details</p>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Company Name</label>
                        <input
                            type="text"
                            required
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Company Domain (Read-Only)</label>
                        <input
                            type="text"
                            disabled
                            value={company.domain}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Industry</label>
                        <input
                            type="text"
                            placeholder="e.g. Technology, Finance"
                            value={companyIndustry}
                            onChange={(e) => setCompanyIndustry(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Contact Information</label>
                        <input
                            type="text"
                            placeholder="e.g. +91 98765 43210"
                            value={companyContactInfo}
                            onChange={(e) => setCompanyContactInfo(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Registered Office Address</label>
                        <input
                            type="text"
                            required
                            value={companyAddress}
                            onChange={(e) => setCompanyAddress(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="col-span-2 bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center justify-between text-sm">
                        <span className="font-semibold text-blue-900">Total Registered Employees</span>
                        <span className="font-extrabold text-blue-600 text-lg bg-white px-3 py-1 rounded-lg border border-blue-100">
                            {company.totalEmployees}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Carpooling Configuration */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-700">Carpooling Configuration</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Define calculations, cost rates, and platform policies</p>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Fuel Cost per Litre (₹)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={fuelCostPerLitre}
                                onChange={(e) => setFuelCostPerLitre(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Travel Cost per Kilometer (₹)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={fuelCostPerKm}
                                onChange={(e) => setFuelCostPerKm(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Allowed Payment Settlement Methods</label>
                        <div className="flex flex-wrap gap-4">
                            {(['Cash', 'Card', 'UPI', 'Wallet'] as const).map((method) => (
                                <label key={method} className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={allowedMethods.includes(method)}
                                        onChange={() => handleToggleMethod(method)}
                                        className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500"
                                    />
                                    {method}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Default Carpooling Policy & Guidelines</label>
                        <textarea
                            rows={4}
                            value={defaultCarpoolPolicy}
                            onChange={(e) => setDefaultCarpoolPolicy(e.target.value)}
                            placeholder="Type policy rules, safety policies, or general advice here..."
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold transition-colors shadow-md"
                >
                    {saving ? 'Saving Settings...' : 'Save Configurations'}
                </button>
            </div>
        </form>
    )
}

export default AdminSettings
