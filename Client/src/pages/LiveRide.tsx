import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { io, Socket } from "socket.io-client";
import MapView, { type LatLng } from "../components/MapView";

interface RideDetail {
  _id: string;
  pickupLocation: { address: string; coordinates?: [number, number] };
  destination: { address: string; coordinates?: [number, number] };
  travelDateTime: string;
  availableSeats: number;
  totalSeats: number;
  farePerSeat: number;
  status: string;
  driverId: { _id: string; name: string; email: string; phone?: string } | null;
  vehicleId: { model: string; registrationNumber: string } | null;
}

interface ChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

interface LocationPayload {
  lat: number;
  lng: number;
  eta: string;
}

const SOCKET_URL = "http://localhost:3000";
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

// Default coords (Gandhinagar, Gujarat) used as fallback
const DEFAULT_PICKUP: LatLng = { lat: 23.0225, lng: 72.5714 };
const DEFAULT_DEST: LatLng = { lat: 23.0338, lng: 72.5856 };

const coordsToLatLng = (
  coords?: [number, number],
  fallback: LatLng = DEFAULT_PICKUP
): LatLng =>
  coords ? { lat: coords[1], lng: coords[0] } : fallback;

const LiveRide: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ─── Ride state ─────────────────────────────────────────────────────────────
  const [ride, setRide] = useState<RideDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rideStatus, setRideStatus] = useState<
    "waiting" | "active" | "completed"
  >("waiting");
  const [completing, setCompleting] = useState(false);

  // ─── Location state ──────────────────────────────────────────────────────────
  /** Driver's real-time position (updated via GPS on driver side, socket on passenger side) */
  const [driverPosition, setDriverPosition] = useState<LatLng | null>(null);
  /** Passenger's own position from browser geolocation */
  const [passengerPosition, setPassengerPosition] = useState<LatLng | null>(null);
  const [eta, setEta] = useState<string>("");

  // ─── Payment state ───────────────────────────────────────────────────────────
  const [myBookingId, setMyBookingId] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // ─── Chat state ──────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState("");

  // ─── Refs ────────────────────────────────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const watchIdRef = useRef<number | null>(null); // GPS watchPosition id

  const isDriver = ride?.driverId?._id === user?._id;

  // ─── Derived map props ───────────────────────────────────────────────────────
  const pickupCoords = coordsToLatLng(
    ride?.pickupLocation.coordinates,
    DEFAULT_PICKUP
  );
  const destCoords = coordsToLatLng(
    ride?.destination.coordinates,
    DEFAULT_DEST
  );

  // ─── Scroll chat ─────────────────────────────────────────────────────────────
  const scrollChat = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  useEffect(scrollChat, [messages, scrollChat]);

  // ─── Fetch ride ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/rides/${id}`);
        const r = res.data.data as RideDetail;
        setRide(r);
        if (r.status === "Completed") setRideStatus("completed");
        else setRideStatus("waiting");
      } catch {
        setError("Failed to load ride details.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  // ─── Fetch passenger booking ─────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !user) return;
    const fetch = async () => {
      try {
        const res = await API.get("/bookings");
        const bookings: any[] = res.data.data ?? [];
        const mine = bookings.find(
          (b: any) =>
            b.rideId?._id === id &&
            (b.status === "Confirmed" || b.status === "Completed")
        );
        if (mine) setMyBookingId(mine._id);
      } catch {
        // non-critical
      }
    };
    fetch();
  }, [id, user]);

  // ─── Socket.IO ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ride || !id) return;
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_trip", { tripId: id });
    });

    socket.on("receive_message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Passenger receives driver location updates
    socket.on("location_changed", (data: LocationPayload) => {
      setDriverPosition({ lat: data.lat, lng: data.lng });
      setEta(data.eta);
      setRideStatus("active");
    });

    return () => {
      socket.disconnect();
    };
  }, [ride, id]);

  // ─── Passenger real GPS ───────────────────────────────────────────────────────
  // Always watch passenger's own position for their own marker
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setPassengerPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // silently ignore — map still shows pickup/dest
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // ─── Driver: start GPS broadcasting ─────────────────────────────────────────
  const startBroadcastingLocation = useCallback(() => {
    if (!id) return;
    setRideStatus("active");
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    const socket = socketRef.current;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Calculate a rough ETA using straight-line distance to destination
        const destLat = destCoords.lat;
        const destLng = destCoords.lng;
        const R = 6371; // km
        const dLat = ((destLat - lat) * Math.PI) / 180;
        const dLng = ((destLng - lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((lat * Math.PI) / 180) *
            Math.cos((destLat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const etaMin = Math.max(0, Math.round((distKm / 30) * 60)); // ~30 km/h avg
        const etaStr = etaMin === 0 ? "Arriving soon" : `~${etaMin} min`;

        setDriverPosition({ lat, lng });
        setEta(etaStr);

        if (socket) {
          socket.emit("update_location", { tripId: id, lat, lng, eta: etaStr });
        }
      },
      (err) => {
        setError(`GPS error: ${err.message}. Make sure location permission is allowed.`);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  }, [id, destCoords]);

  const stopBroadcasting = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // ─── Complete ride (driver) ──────────────────────────────────────────────────
  const handleCompleteRide = async () => {
    if (
      !window.confirm(
        "Mark this ride as completed? Earnings will be credited to your wallet."
      )
    )
      return;
    setCompleting(true);
    stopBroadcasting();
    try {
      await API.post(`/trips/${id}/complete`);
      setRideStatus("completed");
      setRide((prev) => (prev ? { ...prev, status: "Completed" } : prev));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to complete ride.");
    } finally {
      setCompleting(false);
    }
  };

  // ─── Razorpay payment (passenger) ───────────────────────────────────────────
  const handlePayNow = async () => {
    if (!ride) return;
    setPaymentLoading(true);
    setPaymentError("");
    try {
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
          document.body.appendChild(script);
        });
      }

      const orderRes = await API.post("/wallet/ride-payment/order", {
        bookingId: myBookingId,
      });
      const { orderId, amount, currency, key, bookingId } = orderRes.data.data;

      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key,
          amount: Math.round(amount * 100),
          currency,
          name: "CarPool Enterprise",
          description: `Ride Fare — ${ride.pickupLocation.address} → ${ride.destination.address}`,
          order_id: orderId,
          handler: async (response: any) => {
            try {
              await API.post("/wallet/ride-payment/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
              });
              setPaymentDone(true);
              resolve();
            } catch (e: any) {
              reject(new Error(e?.response?.data?.message ?? "Verification failed."));
            }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
          prefill: { name: user?.name ?? "", email: user?.email ?? "" },
          theme: { color: "#2563eb" },
        });
        rzp.on("payment.failed", (resp: any) => {
          reject(new Error(resp?.error?.description ?? "Payment failed."));
        });
        rzp.open();
      });
    } catch (err: any) {
      setPaymentError(err.message ?? "Payment could not be completed.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // ─── Send chat message ────────────────────────────────────────────────────────
  const sendMessage = () => {
    if (!newMsg.trim() || !socketRef.current || !id) return;
    socketRef.current.emit("send_message", {
      tripId: id,
      senderId: user?._id,
      senderName: user?.name ?? "Anonymous",
      text: newMsg.trim(),
    });
    setNewMsg("");
  };

  // ─── Loading / error screens ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !ride) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-sm">
          <p className="text-slate-700 font-semibold">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 px-5 py-3.5 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isDriver ? "/driver" : "/my-bookings")}
            className="text-slate-500 hover:text-slate-700 text-sm font-semibold flex items-center gap-1"
          >
            ← {isDriver ? "Driver Dashboard" : "My Bookings"}
          </button>
          <span className="text-slate-200">|</span>
          <span className="font-bold text-base text-blue-900">Live Ride</span>
        </div>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            rideStatus === "completed"
              ? "bg-blue-100 text-blue-700"
              : rideStatus === "active"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {rideStatus === "completed"
            ? "✓ Completed"
            : rideStatus === "active"
              ? "🚗 In Progress"
              : "⏳ Waiting to Start"}
        </span>
      </header>

      {/* ── Body: Map + Sidebar ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>
        {/* ── Left: Full-height Google Map ── */}
        <div className="flex-1 relative min-h-72">
          {/* ETA overlay */}
          {rideStatus === "active" && eta && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white shadow-lg rounded-full px-5 py-2 flex items-center gap-2 border border-slate-200">
              <span className="text-lg">🚗</span>
              <span className="text-sm font-bold text-blue-700">{eta}</span>
              <span className="text-xs text-slate-400">to destination</span>
            </div>
          )}

          {/* Route label strip */}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm px-4 py-2.5 flex items-center gap-3 border-t border-slate-100 text-sm">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></span>
              <span className="text-slate-600 font-medium truncate">{ride?.pickupLocation.address}</span>
            </div>
            <span className="text-slate-300 flex-shrink-0">→</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"></span>
              <span className="text-slate-600 font-medium truncate">{ride?.destination.address}</span>
            </div>
          </div>

          <MapView
            apiKey={MAPS_API_KEY}
            driverPosition={driverPosition}
            passengerPosition={passengerPosition}
            pickupCoords={pickupCoords}
            destCoords={destCoords}
            isDriver={isDriver}
            eta={eta}
          />
        </div>

        {/* ── Right Sidebar ── */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col bg-white border-l border-slate-200 overflow-y-auto">
          {/* Ride details */}
          <div className="p-5 border-b border-slate-100 space-y-3">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">
              Ride Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Fare / Seat</p>
                <p className="font-extrabold text-blue-600 text-xl mt-0.5">
                  ₹{ride?.farePerSeat}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Departure</p>
                <p className="font-semibold text-slate-800 mt-0.5 text-xs leading-snug">
                  {ride ? new Date(ride.travelDateTime).toLocaleString() : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Driver</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {ride?.driverId?.name ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Vehicle</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {ride?.vehicleId?.model ?? "—"}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  {ride?.vehicleId?.registrationNumber}
                </p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                ⚠️ {error}
              </div>
            )}

            {/* ── Driver Controls ── */}
            {isDriver && (
              <div className="space-y-2 pt-1">
                {rideStatus === "waiting" && (
                  <button
                    onClick={startBroadcastingLocation}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                  >
                    🚀 Start Trip & Share Live Location
                  </button>
                )}
                {rideStatus === "active" && (
                  <button
                    onClick={handleCompleteRide}
                    disabled={completing}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                  >
                    {completing ? "Completing..." : "✅ End Trip & Collect Payment"}
                  </button>
                )}
                {rideStatus === "completed" && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 text-center font-semibold">
                    ✓ Earnings credited to your wallet!
                  </div>
                )}
              </div>
            )}

            {/* ── Passenger Payment ── */}
            {!isDriver && rideStatus === "completed" && ride && (
              <div className="space-y-2 pt-1">
                {paymentDone ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 text-center font-bold">
                    ✅ Payment successful! Driver's wallet credited.
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 text-center">
                      Trip completed! Please pay your fare.
                    </p>
                    {paymentError && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                        ⚠️ {paymentError}
                      </div>
                    )}
                    <button
                      onClick={handlePayNow}
                      disabled={paymentLoading || !myBookingId}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      {paymentLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Opening payment…
                        </>
                      ) : (
                        <>💳 Pay ₹{ride.farePerSeat} via Razorpay</>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Live Chat ── */}
          <div className="flex flex-col flex-1 min-h-64">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-700 text-sm">💬 Trip Chat</h3>
              <p className="text-xs text-slate-400">Real-time chat with driver & co-passengers</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-400 text-sm">No messages yet. Say hi! 👋</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?._id;
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <p className="text-xs text-slate-400 mb-0.5 px-1">{msg.senderName}</p>
                      <div
                        className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm break-words ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-slate-100 text-slate-800 rounded-bl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef}></div>
            </div>

            {/* Chat input */}
            <div className="p-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                placeholder="Type a message…"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={!newMsg.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveRide;
