import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { io, Socket } from "socket.io-client";

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

interface Message {
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

interface LocationData {
  lat: number;
  lng: number;
  eta: string;
}

const SOCKET_URL = "http://localhost:3000";

const LiveRide: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ride, setRide] = useState<RideDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [driverLocation, setDriverLocation] = useState<LocationData | null>(
    null,
  );
  const [rideStatus, setRideStatus] = useState<
    "waiting" | "active" | "completing" | "completed"
  >("waiting");
  const [completing, setCompleting] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  // Passenger's bookingId for this ride — fetched on mount
  const [myBookingId, setMyBookingId] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // Scroll chat to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch ride
  useEffect(() => {
    const fetchRide = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/rides/${id}`);
        const r = res.data.data as RideDetail;
        setRide(r);
        if (r.status === "Completed") setRideStatus("completed");
        else if (r.status === "Active") setRideStatus("waiting");
      } catch {
        setError("Failed to load ride details.");
      } finally {
        setLoading(false);
      }
    };
    fetchRide();
  }, [id]);

  // Fetch the passenger's booking for this ride so we have bookingId for payment
  useEffect(() => {
    if (!id || !user) return;
    const fetchMyBooking = async () => {
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
        // non-critical — payment button will still show, order API will validate
      }
    };
    fetchMyBooking();
  }, [id, user]);

  // Connect Socket.IO when ride is loaded
  useEffect(() => {
    if (!ride || !id) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_trip", { tripId: id });
    });

    socket.on("receive_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("location_changed", (data: LocationData) => {
      setDriverLocation(data);
      setRideStatus("active");
    });

    return () => {
      socket.disconnect();
      if (locationIntervalRef.current)
        clearInterval(locationIntervalRef.current);
    };
  }, [ride, id]);

  // Driver: simulate real movement by broadcasting location every 3 seconds
  const isDriver = ride?.driverId?._id === user?._id;

  const startBroadcastingLocation = useCallback(() => {
    if (!id) return;
    setRideStatus("active");

    // Start from pickup coords, simulate movement toward destination
    let step = 0;
    const socket = socketRef.current;
    const pickup = ride?.pickupLocation.coordinates ?? [72.5714, 23.0225];
    const dest = ride?.destination.coordinates ?? [72.6369, 23.2156];

    locationIntervalRef.current = setInterval(() => {
      step++;
      const progress = Math.min(step / 30, 1);
      const lat = pickup[1] + (dest[1] - pickup[1]) * progress;
      const lng = pickup[0] + (dest[0] - pickup[0]) * progress;
      const etaMin = Math.max(0, Math.round(30 * (1 - progress)));
      const eta = etaMin === 0 ? "Arriving soon" : `~${etaMin} min`;

      if (socket) {
        socket.emit("update_location", { tripId: id, lat, lng, eta });
      }
      setDriverLocation({ lat, lng, eta });

      if (progress >= 1 && locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    }, 3000);
  }, [id, ride]);

  const stopBroadcasting = useCallback(() => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  }, []);

  // Complete the ride (driver action)
  const handleCompleteRide = async () => {
    if (
      !window.confirm(
        "Mark this ride as completed? Earnings will be credited to your wallet.",
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

  // Passenger: Razorpay RIDE-FARE payment on trip completion
  const handlePayNow = async () => {
    if (!ride) return;
    setPaymentLoading(true);
    setPaymentError("");

    try {
      // 1. Load Razorpay script if not already present
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () =>
            reject(new Error("Failed to load Razorpay SDK"));
          document.body.appendChild(script);
        });
      }

      // 2. Create the ride-fare order (uses bookingId, no allowlist restriction)
      const orderRes = await API.post("/wallet/ride-payment/order", {
        bookingId: myBookingId,
      });
      const { orderId, amount, currency, key, bookingId } =
        orderRes.data.data;

      // 3. Open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const options = {
          key,
          amount: Math.round(amount * 100), // paise
          currency,
          name: "CarPool Enterprise",
          description: `Ride Fare — ${ride.pickupLocation.address} → ${ride.destination.address}`,
          order_id: orderId,
          handler: async (response: any) => {
            try {
              // 4. Verify payment & credit driver wallet
              await API.post("/wallet/ride-payment/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
              });
              setPaymentDone(true);
              resolve();
            } catch (verifyErr: any) {
              reject(
                new Error(
                  verifyErr?.response?.data?.message ??
                    "Payment verification failed."
                )
              );
            }
          },
          modal: {
            ondismiss: () =>
              reject(new Error("Payment cancelled by user.")),
          },
          prefill: {
            name: user?.name ?? "",
            email: user?.email ?? "",
          },
          theme: { color: "#2563eb" },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (resp: any) => {
          reject(
            new Error(
              resp?.error?.description ?? "Payment failed. Please retry."
            )
          );
        });
        rzp.open();
      });
    } catch (err: any) {
      setPaymentError(err.message ?? "Payment could not be completed.");
    } finally {
      setPaymentLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isDriver ? "/driver" : "/my-bookings")}
            className="text-slate-500 hover:text-slate-700 text-sm font-semibold flex items-center gap-1"
          >
            ← {isDriver ? "Driver Dashboard" : "My Bookings"}
          </button>
          <span className="text-slate-300">|</span>
          <span className="font-bold text-lg text-blue-900">Live Ride</span>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 grid md:grid-cols-2 gap-5">
        {/* Left column: Map + Ride Info */}
        <div className="space-y-4">
          {/* Simulated Map */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-blue-50 to-slate-100 h-56 relative flex items-center justify-center">
              {rideStatus === "active" && driverLocation ? (
                <div className="text-center">
                  <p className="text-sm font-bold text-blue-800">
                    Driver is on the way
                  </p>
                  <p className="text-xs text-blue-600 mt-1 font-semibold">
                    {driverLocation.eta}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {driverLocation.lat.toFixed(4)},{" "}
                    {driverLocation.lng.toFixed(4)}
                  </p>
                </div>
              ) : rideStatus === "completed" ? (
                <div className="text-center">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-sm font-bold text-green-800">
                    Ride Completed
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-2">📍</div>
                  <p className="text-sm font-medium text-slate-600">
                    {isDriver
                      ? 'Press "Start Trip" to broadcast your location.'
                      : "Waiting for driver to start the trip…"}
                  </p>
                </div>
              )}
            </div>

            {/* Route info */}
            <div className="p-4 space-y-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></span>
                <span className="font-medium text-slate-600 truncate">
                  {ride?.pickupLocation.address}
                </span>
              </div>
              <div className="border-l-2 border-dashed border-slate-200 h-4 ml-1.5"></div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"></span>
                <span className="font-medium text-slate-600 truncate">
                  {ride?.destination.address}
                </span>
              </div>
            </div>
          </div>

          {/* Ride Details card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">
              Ride Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">
                  Departure
                </p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {ride ? new Date(ride.travelDateTime).toLocaleString() : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">
                  Fare / Seat
                </p>
                <p className="font-bold text-blue-600 text-lg mt-0.5">
                  ₹{ride?.farePerSeat}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">
                  Driver
                </p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {ride?.driverId?.name ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">
                  Vehicle
                </p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {ride?.vehicleId?.model ?? "—"}
                </p>
                <p className="font-mono text-xs text-slate-400">
                  {ride?.vehicleId?.registrationNumber}
                </p>
              </div>
            </div>

            {/* Driver Actions */}
            {isDriver && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                {rideStatus === "waiting" && (
                  <button
                    onClick={startBroadcastingLocation}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                  >
                    🚀 Start Trip & Share Location
                  </button>
                )}
                {rideStatus === "active" && (
                  <button
                    onClick={handleCompleteRide}
                    disabled={completing}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                  >
                    {completing
                      ? "Completing..."
                      : "✅ End Trip & Collect Payment"}
                  </button>
                )}
                {rideStatus === "completed" && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 text-center font-semibold">
                    Earnings have been credited to your wallet!
                  </div>
                )}
              </div>
            )}

            {/* Passenger payment action */}
            {!isDriver && rideStatus === "completed" && ride && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                {paymentDone ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 text-center font-bold">
                    ✅ Payment successful! Driver's wallet has been credited.
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 font-semibold text-center">
                      Trip completed! Please pay your fare of{" "}
                      <span className="font-extrabold">₹{ride.farePerSeat}</span>.
                    </div>

                    {paymentError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                        ⚠️ {paymentError}
                      </div>
                    )}

                    <button
                      onClick={handlePayNow}
                      disabled={paymentLoading || !myBookingId}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      {paymentLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Opening payment...
                        </>
                      ) : (
                        <>💳 Pay ₹{ride.farePerSeat} via Razorpay</>
                      )}
                    </button>

                    {!myBookingId && (
                      <p className="text-xs text-slate-400 text-center">
                        Loading booking details…
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Live Chat */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col min-h-80 md:min-h-0">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-700">💬 Trip Chat</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chat with your driver and co-passengers in real-time
            </p>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80 md:max-h-none">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">
                  No messages yet. Say hi! 👋
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderId === user?._id;
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <p className="text-xs text-slate-400 mb-0.5 px-1">
                      {msg.senderName}
                    </p>
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
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
              placeholder="Type a message..."
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </main>
    </div>
  );
};

export default LiveRide;
