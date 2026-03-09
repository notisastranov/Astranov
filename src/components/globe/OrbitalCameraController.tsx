import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface OrbitalCameraControllerProps {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  isZooming: boolean;
}

export default function OrbitalCameraController({ camera, renderer, isZooming }: OrbitalCameraControllerProps) {
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 6;
    controls.maxDistance = 20;
    controls.autoRotate = !isZooming;
    controls.autoRotateSpeed = 0.5;
    
    controlsRef.current = controls;

    return () => {
      controls.dispose();
    };
  }, [camera, renderer]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = !isZooming;
      controlsRef.current.autoRotate = !isZooming;
    }
  }, [isZooming]);

  useEffect(() => {
    const update = () => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      requestAnimationFrame(update);
    };
    const id = requestAnimationFrame(update);
    return () => cancelAnimationFrame(id);
  }, []);

  return null;
}
