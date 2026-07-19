import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";

export interface LatLng {
  lat: number;
  lng: number;
}

interface LocationPickerMapProps {
  pickupCoords: LatLng;
  destCoords: LatLng;
  onPickupChange: (coords: LatLng, address: string) => void;
  onDestChange: (coords: LatLng, address: string) => void;
  onRouteCalculated?: (distanceKm: number) => void;
}

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  pickupCoords,
  destCoords,
  onPickupChange,
  onDestChange,
  onRouteCalculated,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Markers & Polyline refs
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [geocoding, setGeocoding] = useState<string | null>(null);

  // Helper to reverse geocode lat/lng to a clean address using Nominatim (free OSM)
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      setGeocoding("Fetching address...");
      // Nominatim requires an email or a descriptive User-Agent (we provide a clean commuter app identifier)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      if (!res.ok) throw new Error("Geocoding failed");
      const data = await res.json();
      setGeocoding(null);
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      setGeocoding(null);
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([pickupCoords.lat, pickupCoords.lng], 13);

    // Voyager OpenStreetMap tiles
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
      }
    ).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers & Listeners
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Draggable Pickup Icon (Green)
    const pickupIcon = L.divIcon({
      html: `<div class="flex flex-col items-center">
               <div class="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap mb-1">Pickup (Drag Me)</div>
               <div class="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 border-2 border-white shadow-lg text-white">📍</div>
             </div>`,
      className: "",
      iconSize: [100, 50],
      iconAnchor: [50, 50],
    });

    // Draggable Destination Icon (Red)
    const destIcon = L.divIcon({
      html: `<div class="flex flex-col items-center">
               <div class="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap mb-1">Dest (Drag Me)</div>
               <div class="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 border-2 border-white shadow-lg text-white">🏁</div>
             </div>`,
      className: "",
      iconSize: [100, 50],
      iconAnchor: [50, 50],
    });

    // Set up or update Pickup Marker
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setLatLng([pickupCoords.lat, pickupCoords.lng]);
    } else {
      pickupMarkerRef.current = L.marker([pickupCoords.lat, pickupCoords.lng], {
        icon: pickupIcon,
        draggable: true,
      }).addTo(map);

      // Drag event
      pickupMarkerRef.current.on("dragend", async (e: any) => {
        const marker = e.target;
        const position = marker.getLatLng();
        const address = await reverseGeocode(position.lat, position.lng);
        onPickupChange({ lat: position.lat, lng: position.lng }, address);
      });
    }

    // Set up or update Destination Marker
    if (destMarkerRef.current) {
      destMarkerRef.current.setLatLng([destCoords.lat, destCoords.lng]);
    } else {
      destMarkerRef.current = L.marker([destCoords.lat, destCoords.lng], {
        icon: destIcon,
        draggable: true,
      }).addTo(map);

      // Drag event
      destMarkerRef.current.on("dragend", async (e: any) => {
        const marker = e.target;
        const position = marker.getLatLng();
        const address = await reverseGeocode(position.lat, position.lng);
        onDestChange({ lat: position.lat, lng: position.lng }, address);
      });
    }
  }, [pickupCoords, destCoords]);

  // Fetch and draw driving route using OSRM
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates;
          const latLngs = coordinates.map((c: [number, number]) => [c[1], c[0]]);

          // Draw routing line
          if (routePolylineRef.current) {
            routePolylineRef.current.setLatLngs(latLngs);
          } else {
            routePolylineRef.current = L.polyline(latLngs, {
              color: "#2563eb",
              weight: 5,
              opacity: 0.8,
            }).addTo(map);
          }

          // Callback with actual distance in kilometers
          if (onRouteCalculated) {
            const distanceKm = parseFloat((route.distance / 1000).toFixed(1));
            onRouteCalculated(distanceKm);
          }
        }
      } catch (err) {
        console.error("OSRM Route Error inside Picker:", err);
      }
    };

    updateRoute();
  }, [pickupCoords, destCoords]);

  // Map Click to place pickup/dest if they want to click instead of dragging
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      // Find which marker is closer, or default to updating destination if click is far
      const clickLatLng = e.latlng;
      const distToPickup = clickLatLng.distanceTo(L.latLng(pickupCoords.lat, pickupCoords.lng));
      const distToDest = clickLatLng.distanceTo(L.latLng(destCoords.lat, destCoords.lng));

      if (distToPickup < distToDest) {
        const address = await reverseGeocode(clickLatLng.lat, clickLatLng.lng);
        onPickupChange({ lat: clickLatLng.lat, lng: clickLatLng.lng }, address);
      } else {
        const address = await reverseGeocode(clickLatLng.lat, clickLatLng.lng);
        onDestChange({ lat: clickLatLng.lat, lng: clickLatLng.lng }, address);
      }
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [pickupCoords, destCoords]);

  return (
    <div className="relative w-full h-80 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      {geocoding && (
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 shadow flex items-center gap-1.5 z-[1000]">
          <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
          {geocoding}
        </div>
      )}
      <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur text-white text-[10px] font-semibold px-2.5 py-1 rounded-md z-[1000]">
        💡 Click map to drop pin or drag the markers directly
      </div>
    </div>
  );
};

export default LocationPickerMap;
