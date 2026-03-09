import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface GlobalSignal {
  id: string;
  lat: number;
  lng: number;
  type: 'news' | 'work' | 'social' | 'economy' | 'friend';
  label: string;
  description: string;
  color: string;
}

interface GlobalSignalLayerProps {
  scene: THREE.Scene;
  signals: GlobalSignal[];
  onSignalSelect: (signal: GlobalSignal) => void;
  onSignalHover: (signal: GlobalSignal | null) => void;
  camera: THREE.PerspectiveCamera;
}

export default function GlobalSignalLayer({ scene, signals, onSignalSelect, onSignalHover, camera }: GlobalSignalLayerProps) {
  const groupRef = useRef<THREE.Group>(new THREE.Group());

  useEffect(() => {
    const group = groupRef.current;
    scene.add(group);
    
    const textureLoader = new THREE.TextureLoader();
    const nebulaTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/lensflare/lensflare0.png');
    const cloudTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/lensflare/lensflare0_alpha.png');

    const latLngToVector3 = (lat: number, lng: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    signals.forEach(signal => {
      const pos = latLngToVector3(signal.lat, signal.lng, 5.2);
      const signalGroup = new THREE.Group();
      signalGroup.position.copy(pos);
      signalGroup.userData = { signal };
      group.add(signalGroup);

      // Core Marker
      let geometry: THREE.BufferGeometry;
      let material: THREE.Material;

      switch (signal.type) {
        case 'news':
          // Nebula effect
          const spriteMaterial = new THREE.SpriteMaterial({
            map: nebulaTexture,
            color: signal.color,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
          });
          const nebula = new THREE.Sprite(spriteMaterial);
          nebula.scale.set(2, 2, 1);
          signalGroup.add(nebula);
          break;

        case 'work':
          // Cloud-like pulses
          geometry = new THREE.SphereGeometry(0.2, 16, 16);
          material = new THREE.MeshPhongMaterial({
            color: signal.color,
            transparent: true,
            opacity: 0.6,
            emissive: signal.color,
            emissiveIntensity: 0.5
          });
          const cloud = new THREE.Mesh(geometry, material);
          signalGroup.add(cloud);
          
          // Pulse ring
          const ringGeo = new THREE.RingGeometry(0.25, 0.3, 32);
          const ringMat = new THREE.MeshBasicMaterial({ color: signal.color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.lookAt(new THREE.Vector3(0, 0, 0));
          signalGroup.add(ring);
          break;

        case 'social':
          // Glowing signal bubbles
          geometry = new THREE.SphereGeometry(0.15, 16, 16);
          material = new THREE.MeshStandardMaterial({
            color: signal.color,
            emissive: signal.color,
            emissiveIntensity: 1,
            roughness: 0.1,
            metalness: 0.8
          });
          const bubble = new THREE.Mesh(geometry, material);
          signalGroup.add(bubble);
          break;

        case 'economy':
          // Cluster nodes
          geometry = new THREE.OctahedronGeometry(0.15);
          material = new THREE.MeshPhongMaterial({
            color: signal.color,
            emissive: signal.color,
            emissiveIntensity: 0.8,
            flatShading: true
          });
          const node = new THREE.Mesh(geometry, material);
          signalGroup.add(node);
          break;

        case 'friend':
          // Highlighted personal markers
          geometry = new THREE.ConeGeometry(0.1, 0.3, 16);
          material = new THREE.MeshPhongMaterial({ color: signal.color });
          const marker = new THREE.Mesh(geometry, material);
          marker.rotation.x = Math.PI; // Point down
          signalGroup.add(marker);
          break;
      }
    });

    // Interaction logic
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(group.children, true);

      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && !obj.userData.signal) {
          obj = obj.parent;
        }
        if (obj.userData.signal) {
          onSignalHover(obj.userData.signal);
          document.body.style.cursor = 'pointer';
        }
      } else {
        onSignalHover(null);
        document.body.style.cursor = 'default';
      }
    };

    const onClick = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(group.children, true);

      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && !obj.userData.signal) {
          obj = obj.parent;
        }
        if (obj.userData.signal) {
          onSignalSelect(obj.userData.signal);
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);

    return () => {
      scene.remove(group);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
    };
  }, [scene, signals, onSignalSelect, onSignalHover, camera]);

  // Animation for signals
  useEffect(() => {
    const animate = () => {
      const time = Date.now() * 0.001;
      groupRef.current.children.forEach((child, i) => {
        const signal = child.userData.signal as GlobalSignal;
        if (!signal) return;

        // Floating animation
        child.position.y += Math.sin(time + i) * 0.0005;

        // Type specific animations
        if (signal.type === 'work') {
          const ring = child.children.find(c => c instanceof THREE.Mesh && c.geometry instanceof THREE.RingGeometry);
          if (ring) {
            ring.scale.setScalar(1 + Math.sin(time * 2) * 0.2);
            (ring.material as THREE.Material).opacity = 0.5 - (Math.sin(time * 2) * 0.2);
          }
        }
        if (signal.type === 'news') {
          const nebula = child.children[0] as THREE.Sprite;
          nebula.material.rotation += 0.01;
        }
      });
      requestAnimationFrame(animate);
    };
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, []);

  return null;
}
