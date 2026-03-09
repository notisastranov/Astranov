import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SceneTransitionControllerProps {
  camera: THREE.PerspectiveCamera;
  isZooming: boolean;
  targetLat: number;
  targetLng: number;
  onTransitionComplete: () => void;
}

export default function SceneTransitionController({ camera, isZooming, targetLat, targetLng, onTransitionComplete }: SceneTransitionControllerProps) {
  const transitionRef = useRef<{
    startTime: number;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startLookAt: THREE.Vector3;
    endLookAt: THREE.Vector3;
  } | null>(null);

  useEffect(() => {
    if (isZooming) {
      const latLngToVector3 = (lat: number, lng: number, radius: number) => {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        return new THREE.Vector3(
          -radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta)
        );
      };

      const targetPos = latLngToVector3(targetLat, targetLng, 5.5);
      const targetLookAt = latLngToVector3(targetLat, targetLng, 5.0);

      transitionRef.current = {
        startTime: Date.now(),
        startPos: camera.position.clone(),
        endPos: targetPos,
        startLookAt: new THREE.Vector3(0, 0, 0),
        endLookAt: targetLookAt
      };

      const animate = () => {
        if (!transitionRef.current) return;

        const time = (Date.now() - transitionRef.current.startTime) / 3000; // 3 seconds transition
        const progress = Math.min(time, 1);
        const ease = progress * progress * (3 - 2 * progress); // Smoothstep

        camera.position.lerpVectors(transitionRef.current.startPos, transitionRef.current.endPos, ease);
        
        const currentLookAt = new THREE.Vector3();
        currentLookAt.lerpVectors(transitionRef.current.startLookAt, transitionRef.current.endLookAt, ease);
        camera.lookAt(currentLookAt);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          onTransitionComplete();
        }
      };
      
      const id = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(id);
    }
  }, [isZooming, targetLat, targetLng, camera, onTransitionComplete]);

  return null;
}
