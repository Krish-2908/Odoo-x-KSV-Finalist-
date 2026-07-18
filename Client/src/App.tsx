import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Splash from './pages/Splash'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import Settings from './pages/Settings'
import Vehicles from './pages/Vehicles'
import OfferRide from './pages/OfferRide'
import FindRide from './pages/FindRide'
import RideDetails from './pages/RideDetails'
import MyBookings from './pages/MyBookings'
import DriverDashboard from './pages/DriverDashboard'
import WalletPage from './pages/Wallet'
import SavedPlaces from './pages/SavedPlaces'
import TripHistory from './pages/TripHistory'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth()
    if (loading) {
        return (
            <div className="flex min-h-screen bg-slate-50 items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }
    if (!user) {
        return <Navigate to="/login" replace />
    }
    return <>{children}</>
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Splash />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route 
                        path="/dashboard" 
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/admin" 
                        element={
                            <ProtectedRoute>
                                <AdminPanel />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/settings" 
                        element={
                            <ProtectedRoute>
                                <Settings />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/vehicles" 
                        element={
                            <ProtectedRoute>
                                <Vehicles />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/offer-ride" 
                        element={
                            <ProtectedRoute>
                                <OfferRide />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/find-ride" 
                        element={
                            <ProtectedRoute>
                                <FindRide />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/rides/:id" 
                        element={
                            <ProtectedRoute>
                                <RideDetails />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/my-bookings" 
                        element={
                            <ProtectedRoute>
                                <MyBookings />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/driver" 
                        element={
                            <ProtectedRoute>
                                <DriverDashboard />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/wallet" 
                        element={
                            <ProtectedRoute>
                                <WalletPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/saved-places" 
                        element={
                            <ProtectedRoute>
                                <SavedPlaces />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/trip-history" 
                        element={
                            <ProtectedRoute>
                                <TripHistory />
                            </ProtectedRoute>
                        } 
                    />
                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
