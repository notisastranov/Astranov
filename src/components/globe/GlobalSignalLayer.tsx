import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

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
    const nebulaTexture = textureLoader.load('/assets/globe/lensflare0.png');
    const cloudTexture = textureLoader.load('/assets/globe/lensflare0_alpha.png');
    const youtubeTexture = textureLoader.load('/assets/globe/youtube-icon.png');

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
      const altitude = 5.2 + Math.random() * 0.3;
      const pos = latLngToVector3(signal.lat, signal.lng, altitude);
      const signalGroup = new THREE.Group();
      signalGroup.position.copy(pos);
      signalGroup.userData = { signal };
      group.add(signalGroup);

      // Floating Cloud Effect
      const cloudSpriteMat = new THREE.SpriteMaterial({
        map: cloudTexture,
        color: signal.color,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
      });
      cloudSpriteMat.userData.originalOpacity = 0.3;
      const cloud = new THREE.Sprite(cloudSpriteMat);
      cloud.scale.set(1.5, 1.5, 1);
      signalGroup.add(cloud);

      // Core Marker
      let geometry: THREE.BufferGeometry;
      let material: THREE.Material;

      switch (signal.type) {
        case 'youtube':
          const ytSpriteMat = new THREE.SpriteMaterial({
            map: youtubeTexture,
            transparent: true,
            opacity: 0.9,
          });
          ytSpriteMat.userData.originalOpacity = 0.9;
          const ytSprite = new THREE.Sprite(ytSpriteMat);
          ytSprite.scale.set(0.4, 0.4, 1);
          signalGroup.add(ytSprite);
          break;
        case 'news':
          const spriteMaterial = new THREE.SpriteMaterial({
            map: nebulaTexture,
            color: signal.color,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
          });
          spriteMaterial.userData.originalOpacity = 0.8;
          const nebula = new THREE.Sprite(spriteMaterial);
          nebula.scale.set(1, 1, 1);
          signalGroup.add(nebula);
          break;
        case 'work':
          geometry = new THREE.SphereGeometry(0.1, 16, 16);
          const workMat = new THREE.MeshPhongMaterial({
            color: signal.color,
            transparent: true,
            opacity: 0.8,
            emissive: signal.color,
            emissiveIntensity: 0.5
          });
          workMat.userData.originalOpacity = 0.8;
          const workNode = new THREE.Mesh(geometry, workMat);
          signalGroup.add(workNode);
          break;
        default:
          geometry = new THREE.SphereGeometry(0.08, 16, 16);
          const dotMat = new THREE.MeshStandardMaterial({
            color: signal.color,
            emissive: signal.color,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 1
          });
          dotMat.userData.originalOpacity = 1;
          const dot = new THREE.Mesh(geometry, dotMat);
          signalGroup.add(dot);
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
      const cameraDist = camera.position.length();
      
      // Density scaling: signals become smaller and more transparent as we zoom out
      // Globe radius is 5. Orbital view is at 25.
      const scaleFactor = Math.max(0.2, Math.min(1, (25 - cameraDist) / 15 + 0.5));
      const opacityFactor = Math.max(0.3, Math.min(1, (25 - cameraDist) / 10 + 0.3));

      groupRef.current.children.forEach((child, i) => {
        const signal = child.userData.signal as GlobalSignal;
        if (!signal) return;

        // Apply scaling
        child.scale.setScalar(scaleFactor);
        
        child.children.forEach(mesh => {
          if (mesh instanceof THREE.Sprite || mesh instanceof THREE.Mesh) {
            const mat = mesh.material as THREE.Material;
            if (mat.transparent && mat.userData.originalOpacity !== undefined) {
              mat.opacity = mat.userData.originalOpacity * opacityFactor;
            }
          }
        });

        // Floating animation
        child.position.y += Math.sin(time + i) * 0.0005;

        // Type specific animations
        if (signal.type === 'work') {
          const ring = child.children.find(c => c instanceof THREE.Mesh && c.geometry instanceof THREE.RingGeometry) as THREE.Mesh;
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
