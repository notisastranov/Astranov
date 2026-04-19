import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapDisplay() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        // Initialize Map
        mapRef.current = L.map(mapContainerRef.current, {
            center: [38.7223, -9.1393], // Lisbon default
            zoom: 13,
            zoomControl: false,
            attributionControl: false
        });

        // Dark Layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20
        }).addTo(mapRef.current);

        // Add custom styles for map
        const style = document.createElement('style');
        style.innerHTML = `
            .leaflet-container { background: #050505 !important; }
            .leaflet-tile { filter: brightness(0.6) contrast(1.2) sepia(100%) hue-rotate(150deg) saturate(1.5) !important; }
        `;
        document.head.appendChild(style);

        return () => {
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, []);

    return (
        <div className="h-full w-full relative">
            <div ref={mapContainerRef} className="h-full w-full" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-space to-transparent pointer-events-none z-10" />
        </div>
    );
}
