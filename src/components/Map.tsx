import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Task, User, UserRole, Shop } from '../types';

interface MapProps {
  center: { lat: number; lng: number };
  tasks: Task[];
  shops: Shop[];
  users: User[];
  onMapClick: (lat: number, lng: number, x: number, y: number) => void;
  onMarkerClick?: (id: string, type: 'task' | 'shop' | 'user') => void;
  userRole: UserRole;
  userId: string;
  activeRoute?: [number, number][];
  floatingTexts?: { id: string, lat: number, lng: number, text: string }[];
}

export default function AstranovMap({ center, tasks, shops, users, onMapClick, onMarkerClick, userRole, userId, activeRoute, floatingTexts }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markers = useRef<Map<string, L.Marker>>(new Map());
  const routeLine = useRef<any>(null);
  const floatingMarkers = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize Leaflet Map
    mapInstance.current = L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    // Dark Mode Tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(mapInstance.current);

    mapInstance.current.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng, e.containerPoint.x, e.containerPoint.y);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update Center
  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setView([center.lat, center.lng], mapInstance.current.getZoom());
    }
  }, [center.lat, center.lng]);

  // Update Markers
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing markers that are no longer in tasks, users, or shops
    const currentIds = new Set([
      ...tasks.map(t => t.id),
      ...shops.map(s => s.id),
      ...users.map(u => `user-${u.id}`)
    ]);

    markers.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    });

    // Update Route
    if (mapInstance.current) {
      if (routeLine.current) {
        routeLine.current.remove();
        routeLine.current = null;
      }
      if (activeRoute && activeRoute.length >= 2) {
        const [start, end] = activeRoute;
        
        // Fetch real route from OSRM
        fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`)
          .then(res => res.json())
          .then(data => {
            if (data.routes && data.routes[0]) {
              const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
              
              const routeGroup = L.layerGroup().addTo(mapInstance.current!);
              
              L.polyline(coords, {
                color: '#00d2ff',
                weight: 4,
                opacity: 0.8,
                lineCap: 'round'
              }).addTo(routeGroup);
              
              // Add a glowing effect with a second line
              L.polyline(coords, {
                color: '#00d2ff',
                weight: 10,
                opacity: 0.3,
                lineCap: 'round'
              }).addTo(routeGroup);
              
              routeLine.current = routeGroup;
            } else {
              throw new Error("No route found");
            }
          })
          .catch(err => {
            console.error("Routing error, falling back to straight line:", err);
            const routeGroup = L.layerGroup().addTo(mapInstance.current!);
            
            L.polyline(activeRoute, {
              color: '#00d2ff',
              weight: 4,
              opacity: 0.6,
              dashArray: '10, 10',
              lineCap: 'round'
            }).addTo(routeGroup);
            
            L.polyline(activeRoute, {
              color: '#00d2ff',
              weight: 8,
              opacity: 0.2,
              lineCap: 'round'
            }).addTo(routeGroup);
            
            routeLine.current = routeGroup;
          });
      }
    }

    // Update Floating Texts
    if (mapInstance.current && floatingTexts) {
      // Clear old ones
      floatingMarkers.current.forEach((marker, id) => {
        if (!floatingTexts.find(t => t.id === id)) {
          marker.remove();
          floatingMarkers.current.delete(id);
        }
      });

      // Add new ones
      floatingTexts.forEach(ft => {
        if (!floatingMarkers.current.has(ft.id)) {
          const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="animate-money-float text-ok font-black text-lg drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]">${ft.text}</div>`,
            iconSize: [60, 30],
            iconAnchor: [30, 15]
          });
          const marker = L.marker([ft.lat, ft.lng], { icon }).addTo(mapInstance.current!);
          floatingMarkers.current.set(ft.id, marker);
        }
      });
    }

    // Update/Add Task Markers
    tasks.forEach(task => {
      if (!task || !task.id) return;
      const isPizza = (task.description || "").toLowerCase().includes('pizza');
      const markerId = task.id;
      
      if (markers.current.has(markerId)) {
        markers.current.get(markerId)?.setLatLng([task.lat, task.lng]);
      } else {
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="relative group">
                  <div class="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-full border-2 border-electric-blue shadow-[0_0_15px_rgba(0,210,255,0.5)] animate-float">
                    ${isPizza ? '<span class="text-lg">🍕</span>' : '<div class="w-3 h-3 bg-electric-blue rounded-full"></div>'}
                  </div>
                  <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-electric-blue text-black text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg">
                    €${(task.price || 0).toFixed(2)}
                  </div>
                </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const marker = L.marker([task.lat, task.lng], { icon }).addTo(mapInstance.current!);
        
        marker.on('click', () => onMarkerClick?.(task.id, 'task'));

        marker.bindPopup(`
          <div class="bg-black text-white p-3 rounded-xl font-sans min-w-[140px] border border-white/10 shadow-2xl">
            <p class="text-[10px] uppercase font-black text-electric-blue mb-1 tracking-widest">${task.type}</p>
            <p class="text-sm font-bold mb-2">${task.description}</p>
            <div class="flex justify-between items-center bg-white/5 p-2 rounded-lg">
              <span class="text-[10px] text-white/40 uppercase">Offer</span>
              <span class="text-sm font-black text-ok">€${(task.price || 0).toFixed(2)}</span>
            </div>
          </div>
        `, { className: 'custom-popup' });

        markers.current.set(markerId, marker);
      }
    });

    // Update/Add Shop Markers
    shops.forEach(shop => {
      if (markers.current.has(shop.id)) {
        markers.current.get(shop.id)?.setLatLng([shop.lat, shop.lng]);
      } else {
        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="relative group">
                  <div class="w-12 h-12 flex items-center justify-center bg-zinc-900 rounded-2xl border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-float-delayed">
                    <span class="text-xl">🏪</span>
                  </div>
                  <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg uppercase tracking-tighter">
                    +€${(Math.random() * 500).toFixed(0)} Net
                  </div>
                </div>`,
          iconSize: [48, 48],
          iconAnchor: [24, 24]
        });

        const marker = L.marker([shop.lat, shop.lng], { icon }).addTo(mapInstance.current!);
        
        marker.on('click', () => onMarkerClick?.(shop.id, 'shop'));

        marker.bindPopup(`
          <div class="bg-black text-white p-4 rounded-2xl font-sans min-w-[180px] border border-white/10 shadow-2xl">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">🏪</div>
              <div>
                <p class="text-[10px] uppercase font-black text-purple-400 tracking-widest">SHOP</p>
                <p class="text-sm font-black">${shop.name}</p>
              </div>
            </div>
            <p class="text-xs text-white/60 mb-3">${shop.description}</p>
            <div class="bg-white/5 p-3 rounded-xl border border-white/5">
              <p class="text-[9px] text-white/40 uppercase mb-1">Daily Revenue</p>
              <p class="text-lg font-black text-ok">€${(Math.random() * 1200).toFixed(2)}</p>
            </div>
          </div>
        `, { className: 'custom-popup' });

        markers.current.set(shop.id, marker);
      }
    });

    // Update/Add User Markers
    users.forEach(user => {
      if (!user || !user.id) return;
      const markerId = `user-${user.id}`;
      if (markers.current.has(markerId)) {
        markers.current.get(markerId)?.setLatLng([user.lat, user.lng]);
      } else {
        const isMe = user.id === userId;
        const roleIcon = user.role === 'deliverer' ? '🛵' : user.role === 'vendor' ? '👨‍💼' : '👤';
        const roleColor = user.role === 'deliverer' ? 'border-electric-blue' : user.role === 'vendor' ? 'border-purple-500' : 'border-zinc-400';
        const roleBg = user.role === 'deliverer' ? 'bg-electric-blue/20' : user.role === 'vendor' ? 'bg-purple-500/20' : 'bg-zinc-800';
        
        // Simulated stats for demo
        const earnings = Math.floor(Math.random() * 200);
        const spending = Math.floor(Math.random() * 150);
        const net = earnings - spending;

        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="relative group">
                  <div class="w-10 h-10 flex items-center justify-center ${roleBg} rounded-full border-2 ${roleColor} shadow-xl ${isMe ? 'ring-4 ring-white/10' : ''} animate-float">
                    <span class="text-lg">${roleIcon}</span>
                  </div>
                  <div class="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
                    <span class="bg-black/80 backdrop-blur-md text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-white/10 whitespace-nowrap uppercase">
                      ${user.name}
                    </span>
                    <div class="flex flex-col items-center bg-zinc-900/90 border border-white/10 rounded px-1 py-0.5 shadow-lg">
                      <span class="text-[7px] text-white/40 uppercase leading-none">Net Activity</span>
                      <span class="${net >= 0 ? 'text-ok' : 'text-bad'} text-[9px] font-black leading-none">
                        ${net >= 0 ? '+' : ''}${net}€
                      </span>
                    </div>
                  </div>
                </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const marker = L.marker([user.lat, user.lng], { icon }).addTo(mapInstance.current!);
        marker.on('click', () => onMarkerClick?.(user.id, 'user'));
        markers.current.set(markerId, marker);
      }
    });
  }, [tasks, shops, users, userId, activeRoute]);

  return (
    <>
      <div ref={mapRef} className="w-full h-full" />
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes money-float {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-50px); opacity: 0; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 4s ease-in-out infinite;
          animation-delay: 1s;
        }
        .animate-money-float {
          animation: money-float 2s ease-out forwards;
        }
        .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip {
          background: #000 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
