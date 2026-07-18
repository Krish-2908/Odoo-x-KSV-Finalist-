import React, { useEffect, useRef } from "react";
import L from "leaflet";

// Types
export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapViewProps {
  apiKey?: string; // Kept for interface compatibility but unused
  driverPosition: LatLng | null;
  passengerPosition: LatLng | null;
  pickupCoords: LatLng;
  destCoords: LatLng;
  isDriver: boolean;
  eta?: string;
}

const MapView: React.FC<MapViewProps> = ({
  driverPosition,
  passengerPosition,
  pickupCoords,
  destCoords,
  isDriver,
  eta,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Markers
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const passengerMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create leaflet map instance
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([pickupCoords.lat, pickupCoords.lng], 13);

    // Add clean, modern OpenStreetMap tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Draw pickup and destination markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Custom icons using HTML/SVG to avoid Vite asset resolution issues
    const pickupIcon = L.divIcon({
      html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 border-2 border-white shadow-lg text-white">📍</div>`,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const destIcon = L.divIcon({
      html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 border-2 border-white shadow-lg text-white">🏁</div>`,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setLatLng([pickupCoords.lat, pickupCoords.lng]);
    } else {
      pickupMarkerRef.current = L.marker([pickupCoords.lat, pickupCoords.lng], {
        icon: pickupIcon,
      })
        .addTo(map)
        .bindPopup("<b>Pickup Location</b>");
    }

    if (destMarkerRef.current) {
      destMarkerRef.current.setLatLng([destCoords.lat, destCoords.lng]);
    } else {
      destMarkerRef.current = L.marker([destCoords.lat, destCoords.lng], {
        icon: destIcon,
      })
        .addTo(map)
        .bindPopup("<b>Destination</b>");
    }
  }, [pickupCoords, destCoords]);

  // Draw driver position marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (driverPosition) {
      const driverIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 border-2 border-white shadow-2xl animate-bounce">
            <span class="text-lg">🚗</span>
            ${
              eta
                ? `<div class="absolute -top-6 bg-blue-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">${eta}</div>`
                : ""
            }
          </div>
        `,
        className: "",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([driverPosition.lat, driverPosition.lng]);
        if (eta) {
          driverMarkerRef.current.setIcon(driverIcon);
        }
      } else {
        driverMarkerRef.current = L.marker([driverPosition.lat, driverPosition.lng], {
          icon: driverIcon,
          zIndexOffset: 1000,
        })
          .addTo(map)
          .bindPopup(`<b>Driver</b>${eta ? `<br/>ETA: ${eta}` : ""}`);
      }

      // Pan map to driver
      map.panTo([driverPosition.lat, driverPosition.lng]);
    } else {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
        driverMarkerRef.current = null;
      }
    }
  }, [driverPosition, eta]);

  // Draw passenger position marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || isDriver) return;

    if (passengerPosition) {
      const passengerIcon = L.divIcon({
        html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 border-2 border-white shadow-lg text-white text-xs">🧍</div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (passengerMarkerRef.current) {
        passengerMarkerRef.current.setLatLng([passengerPosition.lat, passengerPosition.lng]);
      } else {
        passengerMarkerRef.current = L.marker(
          [passengerPosition.lat, passengerPosition.lng],
          { icon: passengerIcon }
        )
          .addTo(map)
          .bindPopup("<b>You (Passenger)</b>");
      }
    } else {
      if (passengerMarkerRef.current) {
        passengerMarkerRef.current.remove();
        passengerMarkerRef.current = null;
      }
    }
  }, [passengerPosition, isDriver]);

  // Fetch and draw route from OSRM (completely free open source routing)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates;
          // OSRM returns coordinates in [lng, lat] format, Leaflet needs [lat, lng]
          const latLngs = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);

          if (routePolylineRef.current) {
            routePolylineRef.current.setLatLngs(latLngs);
          } else {
            routePolylineRef.current = L.polyline(latLngs, {
              color: "#2563eb",
              weight: 5,
              opacity: 0.75,
            }).addTo(map);
          }
        }
      } catch (err) {
        console.error("OSRM Route Fetch Error:", err);
        // Fallback: draw straight dashed line if route service fails
        const latLngs = [
          [pickupCoords.lat, pickupCoords.lng],
          [destCoords.lat, destCoords.lng],
        ] as L.LatLngExpression[];

        if (routePolylineRef.current) {
          routePolylineRef.current.setLatLngs(latLngs);
        } else {
          routePolylineRef.current = L.polyline(latLngs, {
            color: "#64748b",
            weight: 4,
            dashArray: "5, 10",
            opacity: 0.6,
          }).addTo(map);
        }
      }
    };

    fetchRoute();
  }, [pickupCoords, destCoords]);

  // Zoom bounds to fit all markers initially
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const group = new L.FeatureGroup();
    if (pickupMarkerRef.current) group.addLayer(pickupMarkerRef.current);
    if (destMarkerRef.current) group.addLayer(destMarkerRef.current);
    if (driverMarkerRef.current) group.addLayer(driverMarkerRef.current);
    if (passengerMarkerRef.current) group.addLayer(passengerMarkerRef.current);

    if (group.getLayers().length > 0) {
      map.fitBounds(group.getBounds().pad(0.15));
    }
  }, [pickupCoords, destCoords, driverPosition]);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};

export default MapView;
