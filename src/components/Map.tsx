import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { Task, User, Shop, Publication } from '../types';
import { VideoSignal } from '../types/youtube';

// Initialize Google Maps Loader
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAMYYBnaazrVUTAx9i11HMR0JHwMwIaScA';

setOptions({
  key: GOOGLE_MAPS_API_KEY,
  libraries: ["places"]
});

interface MapProps {
  center: { lat: number; lng: number };
  tasks: Task[];
  shops: Shop[];
  publications?: Publication[];
  groundingShops?: Shop[];
  users: User[];
  onMapClick: (lat: number, lng: number, x: number, y: number) => void;
  onLongPress?: (lat: number, lng: number, x: number, y: number) => void;
  onMarkerClick?: (id: string, type: 'task' | 'shop' | 'user') => void;
  userRole: string;
  userId: string;
  activeRoute?: [number, number][];
  floatingTexts?: { id: string, lat: number, lng: number, text: string }[];
  pendingTaskLocation?: { lat: number, lng: number } | null;
  zoom?: number;
  mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid' | 'dark' | 'earth';
  videoSignals?: VideoSignal[];
  onSignalClick?: (signal: VideoSignal) => void;
}

const DARK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

export default function AstranovMap({ center, tasks, shops, publications, groundingShops, users, onMapClick, onLongPress, onMarkerClick, userId, activeRoute, zoom, mapType = 'dark', videoSignals = [], onSignalClick }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markers = useRef<Map<string, google.maps.Marker>>(new Map());
  const routeLine = useRef<google.maps.Polyline | null>(null);
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(true);

  const [isSimulated, setIsSimulated] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const testApiKey = async () => {
    setTestResult("Testing...");
    try {
      const key = GOOGLE_MAPS_API_KEY;
      
      // Test 1: Static Maps (Basic Auth)
      const staticUrl = `https://maps.googleapis.com/maps/api/staticmap?center=0,0&zoom=1&size=1x1&key=${key}`;
      const staticRes = await fetch(staticUrl);
      
      // Test 2: Places (Library Check)
      const placesUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=test&key=${key}`;
      const placesRes = await fetch(placesUrl);
      const placesData = await placesRes.json();

      let results = [];
      
      if (staticRes.ok) results.push("✅ Maps API: Authorized");
      else results.push(`❌ Maps API: ${staticRes.status} (${staticRes.statusText})`);

      if (placesData.status === "OK" || placesData.status === "ZERO_RESULTS") results.push("✅ Places API: Authorized");
      else results.push(`❌ Places API: ${placesData.status} ${placesData.error_message || ''}`);

      setTestResult(results.join(" | "));
    } catch (e) {
      setTestResult("FAIL: Network Error or CORS Block");
    }
  };

  useEffect(() => {
    // Handle Google Maps authentication failures globally
    (window as any).gm_authFailure = () => {
      console.error("ASTRANOV CRITICAL: Google Maps authentication failed (ApiProjectMapError).");
      (window as any).ASTRANOV_MAP_ERROR = "ApiProjectMapError";
      import('../services/diagnostics').then(m => m.diagnosticService.runAllChecks());
      // Automatically fallback to simulated map to prevent blocking the user
      setIsSimulated(true);
      setIsLoaded(true);
    };

    const loadMap = async () => {
      const key = GOOGLE_MAPS_API_KEY;
      console.log("ASTRANOV: Initializing Map with key:", key ? `${key.slice(0, 4)}...${key.slice(-4)}` : "NONE");
      
      try {
        if (!key || key === 'YOUR_KEY_HERE' || key.trim() === '') {
          console.error("ASTRANOV SYSTEM ERROR: GOOGLE_MAPS_API_KEY is missing.");
          setError("MISSING_KEY");
          return;
        }

        if (!key.startsWith('AIza')) {
          console.error("ASTRANOV SYSTEM ERROR: GOOGLE_MAPS_API_KEY has invalid format (should start with AIza).");
          setError("INVALID_FORMAT");
          return;
        }

        console.log("ASTRANOV: Loading Google Maps SDK via functional API...");
        
        // Import maps first as it's critical
        const { Map } = await importLibrary('maps') as google.maps.MapsLibrary;
        console.log("ASTRANOV: Maps library imported successfully.");
        
        // Try to import places, but don't fail if it doesn't work (might be disabled on key)
        try {
          await importLibrary('places');
          console.log("ASTRANOV: Places library imported successfully.");
        } catch (e) {
          console.warn("ASTRANOV: Places library failed to load. Some features may be limited.", e);
        }

        const MapClass = Map;

        if (!mapRef.current) {
          console.warn("ASTRANOV: mapRef.current is null during initialization.");
          return;
        }

        const mapOptions: google.maps.MapOptions = {
          center: { lat: center.lat, lng: center.lng },
          zoom: zoom || 14,
          disableDefaultUI: true,
          clickableIcons: true,
          backgroundColor: '#000000',
          styles: mapType === 'dark' ? DARK_MAP_STYLES : [],
          tilt: mapType === 'satellite' || mapType === 'hybrid' || mapType === 'earth' ? 45 : 0,
          heading: 0,
          mapTypeId: mapType === 'dark' ? 'roadmap' : (mapType === 'earth' ? 'satellite' : mapType),
          mapTypeControl: false,
          streetViewControl: false,
          rotateControl: true,
          fullscreenControl: false
        };

        mapInstance.current = new MapClass(mapRef.current, mapOptions);
        infoWindow.current = new google.maps.InfoWindow();

        console.log("ASTRANOV: Map instance created successfully.");

        // Monitor for the "ApiProjectMapError" which Google might inject into the DOM
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
              mutation.addedNodes.forEach(node => {
                const el = node as HTMLElement;
                const text = el.innerText || el.textContent || "";
                if (text.includes("ApiProjectMapError") || 
                    text.includes("ApiNotActivatedMapError") ||
                    el.classList?.contains("gm-err-container") ||
                    el.id === "gm-err-container") {
                  (window as any).ASTRANOV_MAP_ERROR = "ApiProjectMapError";
                  import('../services/diagnostics').then(m => m.diagnosticService.runAllChecks());
                  // Automatically fallback to simulated map
                  setIsSimulated(true);
                  setIsLoaded(true);
                }
              });
            }
          });
        });

        // Observe both the map container and the body as Google sometimes injects overlays globally
        if (mapRef.current) {
          observer.observe(mapRef.current, { childList: true, subtree: true });
        }
        observer.observe(document.body, { childList: true, subtree: true });

        // Force styles immediately and then again after a delay
        if (mapType === 'dark') {
          mapInstance.current.setOptions({ styles: DARK_MAP_STYLES });
          setTimeout(() => {
            if (mapInstance.current) {
              mapInstance.current.setOptions({ styles: DARK_MAP_STYLES });
            }
          }, 1000);
        }

        mapInstance.current.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            onMapClick(e.latLng.lat(), e.latLng.lng(), 0, 0);
          }
        });

        setIsLoaded(true);
      } catch (err: any) {
        console.error("ASTRANOV CRITICAL: Failed to load Google Maps:", err);
        const msg = err?.message || '';
        if (msg.includes('RefererNotAllowedMapError')) {
          setError("REFERER_NOT_ALLOWED");
          (window as any).ASTRANOV_MAP_ERROR = "RefererNotAllowedMapError";
        } else {
          setError(`LOAD_FAILURE: ${msg || 'Unknown Error'}`);
        }
      }
    };

    loadMap();
  }, []);

  const handleSimulate = () => {
    setIsSimulated(true);
    setError(null);
    setIsLoaded(true);
  };

  useEffect(() => {
    if (isSimulated || !mapInstance.current) return;
    mapInstance.current.setCenter({ lat: center.lat, lng: center.lng });
    if (zoom !== undefined) mapInstance.current.setZoom(zoom);
    
    const type = mapType === 'hybrid' ? 'hybrid' : 
                 mapType === 'satellite' ? 'satellite' : 
                 mapType === 'earth' ? 'satellite' :
                 mapType === 'terrain' ? 'terrain' : 'roadmap';
    
    // Explicitly set styles for dark mode or clear them for others
    const options: google.maps.MapOptions = {
      mapTypeId: type,
      backgroundColor: '#000000',
      styles: mapType === 'dark' ? DARK_MAP_STYLES : [],
      tilt: mapType === 'satellite' || mapType === 'hybrid' || mapType === 'earth' ? 45 : 0,
    };
    
    mapInstance.current.setOptions(options);
  }, [center, zoom, mapType, isSimulated]);

  useEffect(() => {
    if (isSimulated || !isLoaded || !mapInstance.current) return;

    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const safeShops = Array.isArray(shops) ? shops : [];
    const safePublications = Array.isArray(publications) ? publications : [];
    const safeGroundingShops = Array.isArray(groundingShops) ? groundingShops : [];
    const safeUsers = Array.isArray(users) ? users : [];

    const currentIds = new Set([
      ...safeTasks.map(t => t.id),
      ...safeShops.map(s => s.id),
      ...safePublications.map(p => p.id),
      ...safeGroundingShops.map(s => s.id),
      ...safeUsers.map(u => `user-${u.id}`)
    ]);

    markers.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.setMap(null);
        markers.current.delete(id);
      }
    });

    safeGroundingShops.forEach(shop => {
      if (markers.current.has(shop.id)) {
        markers.current.get(shop.id)?.setPosition({ lat: shop.lat, lng: shop.lng });
      } else {
        const marker = new google.maps.Marker({
          position: { lat: shop.lat, lng: shop.lng },
          map: mapInstance.current,
          title: shop.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#10b881",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
            scale: 8
          }
        });
        marker.addListener("click", () => {
          infoWindow.current?.setContent(`
            <div style="color: black; padding: 8px;">
              <b style="font-size: 14px;">${shop.name}</b>
              <p style="font-size: 10px; color: #666; margin-top: 4px;">Verified via Google Maps</p>
            </div>
          `);
          infoWindow.current?.open(mapInstance.current, marker);
        });
        markers.current.set(shop.id, marker);
      }
    });

    safeTasks.forEach(task => {
      if (markers.current.has(task.id)) {
        markers.current.get(task.id)?.setPosition({ lat: task.lat, lng: task.lng });
      } else {
        const marker = new google.maps.Marker({
          position: { lat: task.lat, lng: task.lng },
          map: mapInstance.current,
          title: task.description,
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            fillColor: "#00d2ff",
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: "#ffffff",
            scale: 5
          }
        });
        marker.addListener("click", () => onMarkerClick?.(task.id, 'task'));
        markers.current.set(task.id, marker);
      }
    });

    safePublications.forEach(pub => {
      if (markers.current.has(pub.id)) {
        markers.current.get(pub.id)?.setPosition({ lat: pub.lat, lng: pub.lng });
      } else {
        const marker = new google.maps.Marker({
          position: { lat: pub.lat, lng: pub.lng },
          map: mapInstance.current,
          title: pub.description,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#f43f5e", // Rose-500 for social/video
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
            scale: 8
          }
        });
        marker.addListener("click", () => {
          infoWindow.current?.setContent(`
            <div style="color: black; padding: 12px; min-width: 200px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <div style="width: 24px; h-24px; border-radius: 50%; background: #f43f5e; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">
                  ${pub.user_name.charAt(0)}
                </div>
                <b style="font-size: 14px;">${pub.user_name}</b>
              </div>
              <div style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">
                [VIDEO CONTENT]
              </div>
              <p style="font-size: 12px; color: #333; margin-top: 4px;">${pub.description}</p>
              <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 10px; color: #666;">
                <span>${pub.likes} Likes</span>
                <span>${pub.views} Views</span>
              </div>
            </div>
          `);
          infoWindow.current?.open(mapInstance.current, marker);
        });
        markers.current.set(pub.id, marker);
      }
    });

    safeUsers.forEach(user => {
      const id = `user-${user.id}`;
      const isMe = user.id === userId;
      if (markers.current.has(id)) {
        markers.current.get(id)?.setPosition({ lat: user.lat, lng: user.lng });
      } else {
        const marker = new google.maps.Marker({
          position: { lat: user.lat, lng: user.lng },
          map: mapInstance.current,
          title: user.name,
          zIndex: isMe ? 100 : 1,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: isMe ? "#00d2ff" : "#ffffff",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: isMe ? "#ffffff" : "#00d2ff",
            scale: isMe ? 10 : 7
          }
        });
        marker.addListener("click", () => onMarkerClick?.(user.id, 'user'));
        markers.current.set(id, marker);
      }
    });

    // Video Signals
    videoSignals.forEach(signal => {
      const id = `signal-${signal.id}`;
      if (!markers.current.has(id)) {
        const marker = new google.maps.Marker({
          position: { lat: signal.lat, lng: signal.lng },
          map: mapInstance.current,
          title: signal.title,
          icon: {
            url: '/assets/globe/youtube-icon.png',
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16)
          }
        });

        marker.addListener('click', () => {
          if (onSignalClick) onSignalClick(signal);
          
          if (infoWindow.current) infoWindow.current.close();
          infoWindow.current = new google.maps.InfoWindow({
            content: `
              <div style="color: #000; padding: 8px; font-family: sans-serif;">
                <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${signal.title}</h3>
                <p style="margin: 0; font-size: 11px; color: #666;">YouTube Signal • ${signal.locationConfidence > 0.8 ? 'Verified' : 'Estimated'}</p>
                <button id="play-video-${signal.id}" style="margin-top: 8px; background: #ff0000; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; width: 100%;">PLAY VIDEO</button>
              </div>
            `
          });
          infoWindow.current.open(mapInstance.current, marker);
          
          google.maps.event.addListenerOnce(infoWindow.current, 'domready', () => {
            document.getElementById(`play-video-${signal.id}`)?.addEventListener('click', () => {
              if (onSignalClick) onSignalClick(signal);
            });
          });
        });
        markers.current.set(id, marker);
      }
    });

  }, [isLoaded, tasks, shops, groundingShops, users, userId, isSimulated, videoSignals]);

  useEffect(() => {
    if (isSimulated || !isLoaded || !mapInstance.current || !activeRoute || activeRoute.length < 2) {
      routeLine.current?.setMap(null);
      return;
    }

    const path = activeRoute.map(r => ({ lat: r[0], lng: r[1] }));
    if (routeLine.current) {
      routeLine.current.setPath(path);
      routeLine.current.setMap(mapInstance.current);
    } else {
      routeLine.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#00d2ff",
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: mapInstance.current
      });
    }
  }, [isLoaded, activeRoute, isSimulated]);

  if (isSimulated) {
    return (
      <div className="relative w-full h-full bg-[#0a0a0a] overflow-hidden flex items-center justify-center">
        {/* Simulated Grid Map */}
        <div className="absolute inset-0 opacity-20" 
             style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '200px 200px' }} />
        
        <div className="z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Simulated Environment
          </div>
          <h2 className="text-white/40 font-black text-4xl uppercase tracking-tighter">Astranov Grid</h2>
          <p className="text-white/20 text-xs uppercase tracking-widest mt-2">Map API offline • Using local coordinates</p>
        </div>

        {/* Simulated Markers */}
        {Array.from(new Map(tasks.map(t => [t.id, t])).values()).map(t => (
          <div key={t.id} className="absolute w-4 h-4 bg-electric-blue rounded-full border-2 border-white shadow-[0_0_10px_rgba(0,210,255,0.5)]"
               style={{ left: `${50 + (t.lng - center.lng) * 1000}%`, top: `${50 - (t.lat - center.lat) * 1000}%` }} />
        ))}
        {Array.from(new Map(users.map(u => [u.id, u])).values()).map(u => (
          <div key={u.id} className={`absolute w-6 h-6 rounded-full border-2 flex items-center justify-center ${u.id === userId ? 'bg-electric-blue border-white' : 'bg-white border-electric-blue'}`}
               style={{ left: `${50 + (u.lng - center.lng) * 1000}%`, top: `${50 - (u.lat - center.lat) * 1000}%` }}>
             <div className="w-1 h-1 bg-black rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Diagnostic Overlay */}
      {error && (
        <div className="absolute inset-0 z-[2000] bg-black/90 flex flex-col items-center justify-center p-8 text-center backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6 border border-red-500/40">
            <span className="text-red-500 text-2xl font-black">!</span>
          </div>
          
          <h2 className="text-xl font-black text-white mb-2 tracking-tighter uppercase">Map System Failure</h2>
          <p className="text-sm text-white/60 mb-8 max-w-md">
            {error === 'MISSING_KEY' ? 'The Google Maps API Key is missing from the system environment.' : 
             error === 'INVALID_FORMAT' ? 'The API Key format is invalid. Google Cloud keys must start with "AIza".' :
             error === 'REFERER_NOT_ALLOWED' ? 'REFERER_ERROR: This domain is not authorized to use this API Key.' :
             error === 'AUTHENTICATION_FAILED' || (window as any).ASTRANOV_MAP_ERROR === 'ApiProjectMapError' ? 'API_PROJECT_ERROR: The Maps JavaScript API is not enabled on your Google Cloud project or the key is restricted.' :
             'The Google Maps JavaScript API is not enabled on your Google Cloud project.'}
          </p>

          {error === 'REFERER_NOT_ALLOWED' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-left w-full max-w-md mb-8">
              <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Critical Configuration Required</h3>
              <p className="text-xs text-white/80 mb-4">You must whitelist this exact URL in your Google Cloud Console:</p>
              <div className="bg-black/40 p-3 rounded-lg font-mono text-[10px] text-electric-blue border border-white/5 break-all mb-4">
                {window.location.origin}/*
              </div>
              <button 
                onClick={() => window.open('https://console.cloud.google.com/google/maps-apis/credentials', '_blank')}
                className="w-full py-2 bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest rounded-lg"
              >
                Open Credentials Settings
              </button>
            </div>
          )}

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left w-full max-w-md mb-8">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Required Actions</h3>
            <ul className="space-y-3 text-xs text-white/80">
              <li className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-electric-blue/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[8px] text-electric-blue font-bold">1</span>
                </div>
                <span>Enable <b>Maps JavaScript API</b> in Google Cloud Console.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-electric-blue/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[8px] text-electric-blue font-bold">2</span>
                </div>
                <span>Link a <b>Billing Account</b> to your project.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-electric-blue/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[8px] text-electric-blue font-bold">3</span>
                </div>
                <span>Ensure <b>Places API</b> and <b>Geocoding API</b> are also enabled.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-electric-blue/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[8px] text-electric-blue font-bold">4</span>
                </div>
                <span>Check <b>API Key Restrictions</b>. Ensure this domain is whitelisted.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-electric-blue hover:text-white transition-all"
            >
              Retry System Load
            </button>

            <button 
              onClick={testApiKey}
              className="px-8 py-3 bg-electric-blue text-white font-black text-xs uppercase tracking-widest rounded-full hover:bg-electric-blue/80 transition-all shadow-[0_0_20px_rgba(0,210,255,0.4)]"
            >
              Run Connection Test
            </button>
            
            <button 
              onClick={handleSimulate}
              className="px-8 py-3 bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-full hover:bg-white/20 transition-all border border-white/10"
            >
              Use Simulated Map
            </button>
          </div>

          {testResult && (
            <div className={`mb-6 p-4 rounded-xl bg-black border w-full max-w-md ${testResult.startsWith('✅') ? 'border-emerald-500/30 text-emerald-500' : 'border-red-500/30 text-red-400'}`}>
              <div className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">Test Results</div>
              <div className="text-xs font-mono">{testResult}</div>
            </div>
          )}

          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="text-[10px] text-white/20 uppercase tracking-widest hover:text-white/40 transition-colors"
          >
            {showDebug ? 'Hide Technical Details' : 'Show Technical Details'}
          </button>

          {showDebug && (
            <div className="mt-4 p-4 bg-black border border-white/5 rounded-xl text-[10px] font-mono text-white/40 text-left w-full max-w-md">
              <div className="flex justify-between mb-1">
                <span>API_KEY_LOADED:</span>
                <span className={GOOGLE_MAPS_API_KEY ? 'text-emerald-500' : 'text-red-500'}>
                  {GOOGLE_MAPS_API_KEY ? 'TRUE' : 'FALSE'}
                </span>
              </div>
              <div className="flex justify-between mb-1">
                <span>KEY_PREVIEW:</span>
                <span>
                  {GOOGLE_MAPS_API_KEY 
                    ? `${GOOGLE_MAPS_API_KEY.slice(0, 4)}...${GOOGLE_MAPS_API_KEY.slice(-4)}`
                    : 'NONE'}
                </span>
              </div>
              <div className="flex justify-between mb-1">
                <span>DOMAIN:</span>
                <span className="text-electric-blue truncate ml-2">{window.location.origin}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>REFERRER:</span>
                <span className="text-electric-blue truncate ml-2">{document.referrer || 'NONE'}</span>
              </div>
              <div className="flex justify-between">
                <span>ERROR_CODE:</span>
                <span className="text-red-400">{error}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
