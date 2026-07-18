import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../services/api'

// Declare Razorpay on window
declare global {
    interface Window {
        Razorpay: any
    }
}

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

const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
        if (document.getElementById('razorpay-script')) {
            resolve(true)
            return
        }
        const script = document.createElement('script')
        script.id = 'razorpay-script'
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
    })

const WalletPage: React.FC = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [wallet, setWallet] = useState<WalletData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
    const [paying, setPaying] = useState(false)

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

    const handlePayWithRazorpay = async () => {
        if (!selectedAmount) {
            setError('Please select a top-up amount.')
            return
        }

        setError('')
        setMessage('')
        setPaying(true)

        try {
            // 1. Load Razorpay checkout script
            const loaded = await loadRazorpayScript()
            if (!loaded) {
                setError('Failed to load Razorpay. Check your internet connection.')
                setPaying(false)
                return
            }

            // 2. Create order on server
            const orderRes = await API.post('/wallet/order', { amount: selectedAmount })
            const { orderId, amountInPaise, currency, key } = orderRes.data.data

            // 3. Open Razorpay checkout modal
            const options = {
                key,
                amount: amountInPaise,
                currency,
                name: 'CarPool Enterprise',
                description: `Wallet Recharge — ₹${selectedAmount}`,
                order_id: orderId,
                prefill: {
                    name: user?.name ?? '',
                    email: user?.email ?? '',
                    contact: ''
                },
                theme: { color: '#2563eb' },
                modal: {
                    ondismiss: () => {
                        setPaying(false)
                        setError('Payment cancelled.')
                    }
                },
                handler: async (response: {
                    razorpay_order_id: string
                    razorpay_payment_id: string
                    razorpay_signature: string
                }) => {
                    try {
                        // 4. Verify payment on server and credit wallet
                        const verifyRes = await API.post('/wallet/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amount: selectedAmount
                        })
                        setWallet(verifyRes.data.data)
                        setMessage(`₹${selectedAmount} added to your wallet successfully!`)
                        setSelectedAmount(null)
                    } catch (err: any) {
                        setError(err.response?.data?.message || 'Payment verification failed.')
                    } finally {
                        setPaying(false)
                    }
                }
            }

            const rzp = new window.Razorpay(options)
            rzp.on('payment.failed', (resp: any) => {
                setError(`Payment failed: ${resp.error?.description ?? 'Unknown error'}`)
                setPaying(false)
            })
            rzp.open()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to initiate payment.')
            setPaying(false)
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
                                ₹{(wallet?.balance ?? 0).toFixed(2)}
                            </p>
                            <div className="flex gap-6 mt-6 pt-6 border-t border-white/20">
                                <div>
                                    <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Total Credited</p>
                                    <p className="text-white font-bold text-lg mt-0.5">+₹{creditTotal.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Total Debited</p>
                                    <p className="text-white font-bold text-lg mt-0.5">-₹{debitTotal.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Transactions</p>
                                    <p className="text-white font-bold text-lg mt-0.5">{wallet?.transactions.length ?? 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Razorpay Top-Up Panel */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Recharge Wallet</h3>
                                <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full border border-blue-100">
                                    Powered by Razorpay
                                </span>
                            </div>

                            {message && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                                    <span>✅</span> {message}
                                </div>
                            )}
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            {/* Amount selector */}
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {TOPUP_AMOUNTS.map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => { setSelectedAmount(amt); setError(''); setMessage('') }}
                                        className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                                            selectedAmount === amt
                                                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm scale-105'
                                                : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                                        }`}
                                    >
                                        ₹{amt}
                                    </button>
                                ))}
                            </div>

                            {/* Razorpay pay button */}
                            <button
                                onClick={handlePayWithRazorpay}
                                disabled={paying || !selectedAmount}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                                {paying ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : selectedAmount ? (
                                    <>Pay ₹{selectedAmount} via Razorpay</>
                                ) : (
                                    'Select an Amount'
                                )}
                            </button>

                            <p className="text-xs text-slate-400 text-center mt-3">
                                🔒 Test mode — use card <span className="font-mono font-semibold">4111 1111 1111 1111</span>, any future expiry & CVV
                            </p>
                        </div>

                        {/* Transaction History */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Transaction History</h3>
                            </div>

                            {!wallet || wallet.transactions.length === 0 ? (
                                <div className="p-10 text-center text-sm text-slate-400">
                                    No transactions yet. Recharge your wallet to get started.
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
                                                        {txn.type === 'Credit' ? '+' : '−'}
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
                                                    {txn.type === 'Credit' ? '+' : '−'}₹{txn.amount.toFixed(2)}
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

export default WalletPage
