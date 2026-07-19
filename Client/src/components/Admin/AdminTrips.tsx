import React, { useState, useEffect, useCallback } from "react";
import API from "../../services/api";

interface TripItem {
  ride: {
    _id: string;
    pickupLocation: { address: string };
    destination: { address: string };
    travelDateTime: string;
    availableSeats: number;
    totalSeats: number;
    farePerSeat: number;
    status: "Active" | "Completed" | "Cancelled";
    driverId: {
      _id: string;
      name: string;
      email: string;
      phone?: string;
      department?: string;
    } | null;
    vehicleId: {
      model: string;
      registrationNumber: string;
      seatingCapacity: number;
    } | null;
  };
  bookings: {
    _id: string;
    seatsBooked: number;
    fareTotal: number;
    paymentMethod: string;
    status: string;
    passengerId: {
      _id: string;
      name: string;
      email: string;
      phone?: string;
      department?: string;
    } | null;
  }[];
}

const statusBadgeStyles: Record<string, string> = {
  Active: "bg-green-100 text-green-700 border-green-200",
  Completed: "bg-blue-100 text-blue-700 border-blue-200",
  Cancelled: "bg-red-100 text-red-600 border-red-200",
};

const AdminTrips: React.FC = () => {
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "All") params.status = statusFilter;

      const res = await API.get("/admin/trips", { params });
      setTrips(res.data.data.trips);
      setTotalCount(res.data.data.total);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load company trip history.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Client-side search filtering by driver name, vehicle, or route address
  const filteredTrips = trips.filter((t) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const driverName = t.ride.driverId?.name?.toLowerCase() || "";
    const vehicleModel = t.ride.vehicleId?.model?.toLowerCase() || "";
    const pickup = t.ride.pickupLocation.address.toLowerCase();
    const dest = t.ride.destination.address.toLowerCase();
    return (
      driverName.includes(term) ||
      vehicleModel.includes(term) ||
      pickup.includes(term) ||
      dest.includes(term)
    );
  });

  const completedCount = trips.filter((t) => t.ride.status === "Completed").length;
  const activeCount = trips.filter((t) => t.ride.status === "Active").length;
  const totalPassengers = trips.reduce(
    (acc, t) => acc + t.bookings.filter((b) => b.status === "Completed" || b.status === "Confirmed").length,
    0
  );

  return (
    <div className="space-y-6">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">
            Total Trips Offered
          </p>
          <p className="text-3xl font-extrabold text-slate-800 mt-2">{totalCount}</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">
            Active Rides
          </p>
          <p className="text-3xl font-extrabold text-green-600 mt-2">{activeCount}</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">
            Completed Trips
          </p>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">{completedCount}</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">
            Passengers Carried
          </p>
          <p className="text-3xl font-extrabold text-purple-600 mt-2">{totalPassengers}</p>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {["All", "Active", "Completed", "Cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search driver, vehicle, or route…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ── Trips List ── */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-3xl mb-2">🚗</p>
          <p className="font-bold text-slate-700 text-base">No Trip History Found</p>
          <p className="text-slate-400 text-xs mt-1">
            No company trips match your selected status or search query.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTrips.map(({ ride, bookings }) => {
            const isExpanded = expandedTripId === ride._id;
            return (
              <div
                key={ride._id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Main Trip Card Header */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    {/* Driver & Vehicle */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                        {ride.driverId?.name?.[0] ?? "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-slate-800 text-sm">
                            {ride.driverId?.name ?? "Unknown Driver"}
                          </p>
                          {ride.driverId?.department && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded">
                              {ride.driverId.department}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {ride.vehicleId
                            ? `${ride.vehicleId.model} (${ride.vehicleId.registrationNumber})`
                            : "No vehicle info"}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        statusBadgeStyles[ride.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ride.status}
                    </span>
                  </div>

                  {/* Pickup -> Destination */}
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                      <span className="font-semibold text-slate-700 truncate">
                        {ride.pickupLocation.address}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
                      <span className="font-semibold text-slate-700 truncate">
                        {ride.destination.address}
                      </span>
                    </div>
                  </div>

                  {/* Trip details grid */}
                  <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs border-t border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Departure</p>
                      <p className="font-semibold text-slate-700 mt-0.5">
                        {new Date(ride.travelDateTime).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Fare / Seat</p>
                      <p className="font-extrabold text-blue-600 mt-0.5">₹{ride.farePerSeat}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Seats Left</p>
                      <p className="font-bold text-slate-700 mt-0.5">
                        {ride.availableSeats} / {ride.totalSeats}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Bookings</p>
                      <p className="font-bold text-purple-600 mt-0.5">{bookings.length}</p>
                    </div>
                  </div>
                </div>

                {/* Expand Bookings Toggle */}
                {bookings.length > 0 && (
                  <div className="bg-slate-50 border-t border-slate-100 px-5 py-2.5 flex items-center justify-between">
                    <button
                      onClick={() =>
                        setExpandedTripId(isExpanded ? null : ride._id)
                      }
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>{isExpanded ? "▲ Hide Passenger Details" : "▼ View Passengers & Bookings"}</span>
                      <span className="text-slate-400 font-normal">({bookings.length})</span>
                    </button>

                    <span className="text-[11px] text-slate-400">
                      Total Fare Collected: ₹
                      {bookings.reduce((sum, b) => sum + b.fareTotal, 0)}
                    </span>
                  </div>
                )}

                {/* Bookings expansion drawer */}
                {isExpanded && bookings.length > 0 && (
                  <div className="bg-slate-50 border-t border-slate-200/80 p-4 space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Passenger Bookings Log
                    </p>
                    <div className="space-y-2">
                      {bookings.map((b) => (
                        <div
                          key={b._id}
                          className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs shadow-2xs"
                        >
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-800">
                              {b.passengerId?.name ?? "Passenger"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {b.passengerId?.email} • {b.passengerId?.department ?? "Employee"}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <p className="font-bold text-slate-700">₹{b.fareTotal}</p>
                              <p className="text-[10px] text-slate-400">{b.seatsBooked} seat(s) • {b.paymentMethod}</p>
                            </div>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                                b.status === "Completed" || b.status === "Confirmed"
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminTrips;
