import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Splash: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-800">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md shadow-blue-200">
            🚗
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-blue-900 tracking-tight leading-none">
              Odoo Commute
            </h1>
            <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mt-0.5">
              Enterprise Carpool
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          ) : user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-100 hover:scale-105 active:scale-95"
            >
              Go to Dashboard →
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-slate-600 hover:text-blue-600 font-bold text-sm transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-100 hover:scale-105 active:scale-95"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Hero Section ── */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Trusted by enterprise professionals
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Share your drive.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Save the planet.
              </span>
            </h2>

            <p className="text-slate-600 text-base md:text-lg font-medium leading-relaxed max-w-xl">
              Connect with verified coworkers to share your daily commute.
              Reduce travel costs, lower carbon emissions, and build meaningful professional relationships on the road.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              {user ? (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-base transition-all shadow-lg shadow-blue-100 hover:scale-105 active:scale-95"
                >
                  Enter Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/register")}
                    className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-base transition-all shadow-lg shadow-blue-100 hover:scale-105 active:scale-95"
                  >
                    Start Commuting
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="px-8 py-3.5 border-2 border-slate-200 hover:border-blue-600 hover:text-blue-600 text-slate-600 font-extrabold rounded-xl text-base transition-all bg-white hover:bg-slate-50"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>

            {/* Quick Live Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-100">
              <div>
                <p className="text-2xl md:text-3xl font-black text-slate-900">4,200+</p>
                <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5">kg CO₂ Saved</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-black text-slate-900">12,500</p>
                <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5">Trips Shared</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-black text-slate-900">99.8%</p>
                <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5">Safety Rating</p>
              </div>
            </div>
          </div>

          {/* Interactive Feature Visualizer */}
          <div className="relative flex items-center justify-center">
            {/* Background design elements */}
            <div className="absolute w-72 h-72 bg-gradient-to-tr from-blue-400 to-indigo-400 rounded-full blur-3xl opacity-20 -top-8 -right-8"></div>
            <div className="absolute w-72 h-72 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full blur-3xl opacity-20 -bottom-8 -left-8"></div>

            {/* Simulated Live Ride Tracking Card */}
            <div className="relative w-full max-w-sm bg-white border border-slate-200/80 rounded-3xl shadow-2xl shadow-slate-200 overflow-hidden transform hover:rotate-1 hover:scale-[1.02] transition-all duration-300">
              <div className="bg-gradient-to-br from-blue-50 to-slate-50 h-48 relative flex items-center justify-center p-6 border-b border-slate-100">
                {/* Simulated Leaflet Map Pins */}
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-70"></div>
                <div className="relative text-center space-y-2">
                  <div className="inline-block px-3 py-1 bg-green-500 text-white text-[10px] font-black rounded-full animate-pulse">
                    LIVE RIDE
                  </div>
                  <div className="text-4xl">🚗</div>
                  <p className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Tesla Model 3 • Gujarat State Hwy
                  </p>
                  <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                    ETA ~4 min
                  </p>
                </div>
              </div>

              {/* Passenger Card Footer info */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                      BS
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">Bob Smith (Driver)</p>
                      <p className="text-[10px] text-slate-400 font-semibold">Odoo Engineering</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                    ₹48.00
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="truncate">Odoo House, Gandhinagar</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="truncate">Ahmedabad City Center</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Highlights ── */}
        <section className="bg-slate-100/50 border-t border-b border-slate-200/50 py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight text-center mb-12">
              Why Commute With Coworkers?
            </h3>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm space-y-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-xl font-bold">
                  🛡️
                </div>
                <h4 className="font-extrabold text-lg text-slate-800">Verified Employees Only</h4>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Safety first. Platform access is restricted strictly to verified employees sharing domain-specific corporate accounts.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm space-y-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 text-xl font-bold">
                  🗺️
                </div>
                <h4 className="font-extrabold text-lg text-slate-800">Live GPS & Route Tracking</h4>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Real-time Leaflet tracking map showing exact passenger and driver positions with live update syncing and dynamic ETA.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm space-y-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 text-xl font-bold">
                  💳
                </div>
                <h4 className="font-extrabold text-lg text-slate-800">Seamless Razorpay Payments</h4>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Direct wallet credit routing on ride completion. Support for direct Razorpay UPI, card, and netbanking payments.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-100 py-8 px-6 text-center text-xs text-slate-400 font-semibold">
        <p>© {new Date().getFullYear()} Odoo Commute Enterprise Carpooling. All rights reserved.</p>
        <p className="mt-1 text-slate-300">Sustainable, collaborative commuting for modern businesses.</p>
      </footer>
    </div>
  );
};

export default Splash;
