import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Cloud, Wind, Zap, Globe as GlobeIcon, Users } from 'lucide-react';
import GlobalSignalLayer from './globe/GlobalSignalLayer';
import OrbitalCameraController from './globe/OrbitalCameraController';
import SceneTransitionController from './globe/SceneTransitionController';
import AtmosphereTransition from './globe/AtmosphereTransition';

interface GlobalSignal {
  id: string;
  lat: number;
  lng: number;
  type: 'news' | 'work' | 'social' | 'economy' | 'friend' | 'youtube' | 'event';
  label: string;
  description: string;
  color: string;
  youtubeId?: string;
}

interface GlobeSceneProps {
  onSignalSelect: (signal: GlobalSignal) => void;
  isZooming: boolean;
  onTransitionComplete: () => void;
  viewState: 'orbital' | 'map' | 'city';
  signals?: GlobalSignal[];
}

const SIGNALS: GlobalSignal[] = [
  { id: '1', lat: 40.7128, lng: -74.0060, type: 'work', label: 'Tech Hub Alpha', description: 'Major engineering opportunities in New York', color: '#00d2ff' },
  { id: '2', lat: 51.5074, lng: -0.1278, type: 'news', label: 'London Nexus', description: 'Global financial updates incoming', color: '#ff4e00' },
  { id: '3', lat: 35.6762, lng: 139.6503, type: 'social', label: 'Tokyo Pulse', description: 'High social activity detected', color: '#f43f5e' },
  { id: '4', lat: -33.8688, lng: 151.2093, type: 'economy', label: 'Sydney Market', description: 'Commercial clusters forming', color: '#10b881' },
  { id: '5', lat: -23.5505, lng: -46.6333, type: 'youtube', label: 'São Paulo Nebula', description: 'Regional news nebula detected', color: '#ff0000', youtubeId: 'dQw4w9WgXcQ' },
  { id: '6', lat: 48.8566, lng: 2.3522, type: 'friend', label: 'Marc V.', description: 'Active now in Paris', color: '#ffffff' },
];

export default function GlobeScene({ onSignalSelect, isZooming, onTransitionComplete, viewState, signals = [] }: GlobeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sceneData, setSceneData] = useState<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
  } | null>(null);

  const [hoveredSignal, setHoveredSignal] = useState<GlobalSignal | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<GlobalSignal | null>(null);
  const [zoomProgress, setZoomProgress] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Globe
    const geometry = new THREE.SphereGeometry(5, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    
    const earthTexture = textureLoader.load('/textures/earth-blue-marble.jpg');
    const bumpMap = textureLoader.load('/textures/earth-topology.png');
    const specMap = textureLoader.load('/textures/earth-water.png');

    const material = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: bumpMap,
      bumpScale: 0.05,
      specularMap: specMap,
      specular: new THREE.Color('grey'),
      shininess: 5
    });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Clouds
    const cloudGeometry = new THREE.SphereGeometry(5.1, 64, 64);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2
    });
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(clouds);

    // Atmosphere Glow
    const atmosphereGeometry = new THREE.SphereGeometry(5.5, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      uniforms: {
        glowColor: { value: new THREE.Color(0x00d2ff) },
        viewVector: { value: camera.position }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
          gl_FragColor = vec4(glowColor, intensity);
        }
      `
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Stars and Constellations
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.8 });
    const starVertices = [];
    for (let i = 0; i < 15000; i++) {
      const x = (Math.random() - 0.5) * 3000;
      const y = (Math.random() - 0.5) * 3000;
      const z = (Math.random() - 0.5) * 3000;
      starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Space Nebula
    const nebulaGeometry = new THREE.SphereGeometry(800, 32, 32);
    const nebulaMaterial = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.1,
      color: 0x1a0b2e // Realistic deep purple/blue
    });
    const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
    scene.add(nebula);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 3);
    sunLight.position.set(20, 10, 20);
    scene.add(sunLight);

    camera.position.z = 25; // Start further out for orbital view

    setSceneData({ scene, camera, renderer });

    // Animation Loop
    const animate = () => {
      const frameId = requestAnimationFrame(animate);
      
      if (!isZooming) {
        globe.rotation.y += 0.0003;
        clouds.rotation.y += 0.0004;
        stars.rotation.y += 0.00005;
      }

      renderer.render(scene, camera);
    };
    const frameId = requestAnimationFrame(animate);

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      renderer.dispose();
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (!sceneData) return;
    
    // Handle viewState transitions
    const targetZ = viewState === 'orbital' ? 25 : 15;
    const duration = 2000;
    const startZ = sceneData.camera.position.z;
    const startTime = Date.now();

    const animateZoom = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
      
      sceneData.camera.position.z = startZ + (targetZ - startZ) * easeProgress;
      setZoomProgress(easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animateZoom);
      }
    };
    animateZoom();
  }, [viewState, sceneData]);

  const handleSignalSelect = (signal: GlobalSignal) => {
    setSelectedSignal(signal);
    onSignalSelect(signal);
  };

  return (
    <div className="relative w-full h-full bg-[#050505] overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      
      {sceneData && (
        <>
          <OrbitalCameraController 
            camera={sceneData.camera} 
            renderer={sceneData.renderer} 
            isZooming={isZooming} 
          />
          <GlobalSignalLayer 
            scene={sceneData.scene} 
            signals={signals.length > 0 ? signals : SIGNALS} 
            onSignalSelect={handleSignalSelect} 
            onSignalHover={setHoveredSignal}
            camera={sceneData.camera}
          />
          {selectedSignal && (
            <SceneTransitionController 
              camera={sceneData.camera}
              isZooming={isZooming}
              targetLat={selectedSignal.lat}
              targetLng={selectedSignal.lng}
              onTransitionComplete={onTransitionComplete}
            />
          )}
        </>
      )}

      {/* HUD Overlay for Globe Scene */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-electric-blue animate-pulse" />
              <span className="text-[10px] font-black text-electric-blue uppercase tracking-[0.3em]">Planetary Link Active</span>
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Astranov Global</h1>
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Orbital Intelligence Platform v4.2</p>
          </motion.div>
        </div>

        <div className="absolute bottom-10 left-10 flex flex-col gap-4">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[8px] text-white/20 uppercase font-black tracking-widest">Orbital Velocity</span>
              <span className="text-xl font-black text-white font-mono">27,600 KM/H</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[8px] text-white/20 uppercase font-black tracking-widest">Altitude</span>
              <span className="text-xl font-black text-white font-mono">408 KM</span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {hoveredSignal && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 min-w-[240px] shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    {hoveredSignal.type === 'news' && <Wind className="w-5 h-5 text-purple-400" />}
                    {hoveredSignal.type === 'work' && <Zap className="w-5 h-5 text-electric-blue" />}
                    {hoveredSignal.type === 'social' && <Sparkles className="w-5 h-5 text-rose-400" />}
                    {hoveredSignal.type === 'economy' && <Cloud className="w-5 h-5 text-emerald-400" />}
                    {hoveredSignal.type === 'friend' && <Users className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">{hoveredSignal.label}</h3>
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{hoveredSignal.type} Signal</span>
                  </div>
                </div>
                <p className="text-xs text-white/60 leading-relaxed mb-4">{hoveredSignal.description}</p>
                <div className="flex items-center gap-2 text-[10px] font-black text-electric-blue uppercase tracking-widest">
                  <GlobeIcon className="w-3 h-3" />
                  <span>Click to Initiate Atmospheric Entry</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AtmosphereTransition isZooming={isZooming} progress={zoomProgress} />
    </div>
  );
}
