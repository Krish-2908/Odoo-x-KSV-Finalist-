import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'

const TOPUP_AMOUNTS = [100, 200, 500, 1000, 2000, 5000]

interface Transaction {
    _id: string
    amount: number
    type: 'Credit' | 'Debit'
    description: string
    createdAt: string
}

interface WalletData {
    balance: number
    transactions: Transaction[]
}

const Wallet: React.FC = () => {
    const navigate = useNavigate()
    const [wallet, setWallet] = useState<WalletData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
    const [topping, setTopping] = useState(false)

    const fetchWallet = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await API.get('/wallet')
            setWallet(res.data.data)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load wallet.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchWallet()
    }, [fetchWallet])

    const handleTopUp = async () => {
        if (!selectedAmount) {
            setError('Please select a top-up amount.')
            return
        }
        setError('')
        setMessage('')
        setTopping(true)
        try {
            const res = await API.post('/wallet/topup', { amount: selectedAmount })
            setWallet(res.data.data)
            setMessage(`Successfully added $${selectedAmount} to your wallet!`)
            setSelectedAmount(null)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Top-up failed.')
        } finally {
            setTopping(false)
        }
    }

    const creditTotal = wallet?.transactions.filter((t) => t.type === 'Credit').reduce((s, t) => s + t.amount, 0) ?? 0
    const debitTotal = wallet?.transactions.filter((t) => t.type === 'Debit').reduce((s, t) => s + t.amount, 0) ?? 0

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
                    <span className="font-bold text-lg text-blue-900">My Wallet</span>
                </div>
            </header>

            <main className="flex-1 max-w-2xl w-full mx-auto p-6 md:p-8 space-y-6">
                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* Balance Card */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_80%_20%,_white_0%,_transparent_60%)]"></div>
                            <p className="text-blue-200 text-sm font-semibold uppercase tracking-wider">Available Balance</p>
                            <p className="text-5xl font-extrabold mt-2 tracking-tight">
                                ${(wallet?.balance ?? 0).toFixed(2)}
                            </p>
                            <div className="flex gap-6 mt-6 pt-6 border-t border-white/20">
                                <div>
                                    <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Total Credited</p>
                                    <p className="text-white font-bold text-lg mt-0.5">+${creditTotal.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Total Debited</p>
                                    <p className="text-white font-bold text-lg mt-0.5">-${debitTotal.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Transactions</p>
                                    <p className="text-white font-bold text-lg mt-0.5">{wallet?.transactions.length ?? 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Top-Up Panel */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                            <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wide">Add Funds</h3>

                            {message && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                                    {message}
                                </div>
                            )}
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {TOPUP_AMOUNTS.map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => { setSelectedAmount(amt); setError(''); setMessage(''); }}
                                        className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                                            selectedAmount === amt
                                                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm scale-105'
                                                : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                                        }`}
                                    >
                                        ${amt}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleTopUp}
                                disabled={topping || !selectedAmount}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
                            >
                                {topping
                                    ? 'Processing...'
                                    : selectedAmount
                                    ? `Top Up $${selectedAmount}`
                                    : 'Select an Amount'}
                            </button>
                        </div>

                        {/* Transaction History */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Transaction History</h3>
                            </div>

                            {!wallet || wallet.transactions.length === 0 ? (
                                <div className="p-10 text-center text-sm text-slate-400">
                                    No transactions yet. Top up your wallet to get started.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {[...wallet.transactions]
                                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                        .map((txn) => (
                                            <div key={txn._id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                                        txn.type === 'Credit'
                                                            ? 'bg-green-100 text-green-600'
                                                            : 'bg-red-100 text-red-500'
                                                    }`}>
                                                        {txn.type === 'Credit' ? '+' : '-'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 text-sm">{txn.description}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {new Date(txn.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className={`font-extrabold text-base flex-shrink-0 ml-4 ${
                                                    txn.type === 'Credit' ? 'text-green-600' : 'text-red-500'
                                                }`}>
                                                    {txn.type === 'Credit' ? '+' : '-'}${txn.amount.toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}

export default Wallet
