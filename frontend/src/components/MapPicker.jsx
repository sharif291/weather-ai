import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export const MapPicker = ({ lat, lon, onChange }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix default marker icon url resolution in Webpack/Vite
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    // Default center
    const defaultLat = lat ? parseFloat(lat) : 23.8103; // Default coordinates (Dhaka/Bangladesh or user loc)
    const defaultLon = lon ? parseFloat(lon) : 90.4125;

    // Initialize map
    mapRef.current = L.map(mapContainerRef.current).setView([defaultLat, defaultLon], 10);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current);

    // Create marker
    markerRef.current = L.marker([defaultLat, defaultLon], {
      draggable: true
    }).addTo(mapRef.current);

    // Event: Click on map
    mapRef.current.on('click', (e) => {
      const { lat: newLat, lng: newLng } = e.latlng;
      markerRef.current.setLatLng([newLat, newLng]);
      onChange(newLat.toFixed(6), newLng.toFixed(6));
    });

    // Event: Drag marker
    markerRef.current.on('dragend', () => {
      const position = markerRef.current.getLatLng();
      onChange(position.lat.toFixed(6), position.lng.toFixed(6));
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker position if lat/lon changes from outside (e.g. city typing resolution)
  useEffect(() => {
    if (mapRef.current && markerRef.current && lat && lon) {
      const parsedLat = parseFloat(lat);
      const parsedLon = parseFloat(lon);
      if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
        const currentPos = markerRef.current.getLatLng();
        // Prevent infinite loops if change is negligible
        if (Math.abs(currentPos.lat - parsedLat) > 0.0001 || Math.abs(currentPos.lng - parsedLon) > 0.0001) {
          markerRef.current.setLatLng([parsedLat, parsedLon]);
          mapRef.current.setView([parsedLat, parsedLon], mapRef.current.getZoom());
        }
      }
    }
  }, [lat, lon]);

  return (
    <div className="space-y-1">
      <div 
        ref={mapContainerRef} 
        className="w-full h-44 rounded-xl border border-slate-800 shadow bg-slate-950 overflow-hidden"
        style={{ zIndex: 1 }}
      />
      <p className="text-[10px] text-slate-500 italic text-center">
        💡 Click anywhere on the map or drag the pin to set precision farm coordinates.
      </p>
    </div>
  );
};

export default MapPicker;
