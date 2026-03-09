import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ShieldAlert, ShieldCheck, Battery, Bell, Mic, MapPin, Zap, Activity, X, Monitor, Radio, Power, Cpu, HardDrive, Thermometer, Bluetooth, Wifi, Signal, Globe, RadioTower, RefreshCw, Settings, Gamepad2, Euro, Users, Layers, Filter, Radar, Badge, Drone } from 'lucide-react';

export interface PermissionStatus {
  name: string;
  status: 'granted' | 'denied' | 'prompt' | 'unsupported';
  icon: any;
}

export interface DeviceSpecs {
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  battery: string;
  temp: string;
}

export interface NetworkSpecs {
  bluetooth: 'active' | 'inactive';
  wifi: 'active' | 'inactive';
  gsm: 'active' | 'inactive';
  fiveG: 'active' | 'inactive';
  longRange: 'active' | 'inactive';
  magneticField: string;
  powerUsage: string;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionStatus[]>([]);
  const [wakeLock, setWakeLock] = useState<any>(null);
  const [deviceSpecs, setDeviceSpecs] = useState<DeviceSpecs>({
    cpu: "Detecting...",
    gpu: "Detecting...",
    ram: "Detecting...",
    storage: "Detecting...",
    battery: "Detecting...",
    temp: "32°C"
  });
  const [networkSpecs, setNetworkSpecs] = useState<NetworkSpecs>({
    bluetooth: 'active',
    wifi: 'active',
    gsm: 'active',
    fiveG: 'active',
    longRange: 'inactive',
    magneticField: '45.2 µT',
    powerUsage: '1.2 W'
  });

  const checkPermissions = useCallback(async () => {
    const statusList: PermissionStatus[] = [];

    // Geolocation
    try {
      const geo = await navigator.permissions.query({ name: 'geolocation' as any });
      statusList.push({ name: 'Location', status: geo.state as any, icon: MapPin });
    } catch {
      statusList.push({ name: 'Location', status: 'unsupported', icon: MapPin });
    }

    // Microphone
    try {
      const mic = await navigator.permissions.query({ name: 'microphone' as any });
      statusList.push({ name: 'Microphone', status: mic.state as any, icon: Mic });
    } catch {
      statusList.push({ name: 'Microphone', status: 'unsupported', icon: Mic });
    }

    // Notifications
    if (!('Notification' in window)) {
      statusList.push({ name: 'Notifications', status: 'unsupported', icon: Bell });
    } else {
      statusList.push({ name: 'Notifications', status: Notification.permission as any, icon: Bell });
    }

    // Battery
    if ('getBattery' in navigator) {
      try {
        const battery: any = await (navigator as any).getBattery();
        statusList.push({ name: 'Battery Optimization', status: 'granted', icon: Battery });
      } catch {
        statusList.push({ name: 'Battery Optimization', status: 'denied', icon: Battery });
      }
    } else {
      statusList.push({ name: 'Battery Optimization', status: 'unsupported', icon: Battery });
    }

    // Wake Lock (Keep Alive)
    if ('wakeLock' in navigator) {
      try {
        const status = await navigator.permissions.query({ name: 'screen-wake-lock' as any });
        statusList.push({ name: 'Keep Alive', status: status.state === 'granted' ? 'granted' : (status.state === 'denied' ? 'denied' : 'prompt'), icon: Zap });
      } catch {
        // If query fails, fallback to checking the wakeLock variable
        statusList.push({ name: 'Keep Alive', status: wakeLock ? 'granted' : 'prompt', icon: Zap });
      }
    } else {
      statusList.push({ name: 'Keep Alive', status: 'unsupported', icon: Zap });
    }

    // Performance / Memory
    if ('memory' in performance) {
      statusList.push({ name: 'Performance', status: 'granted', icon: Activity });
    } else {
      statusList.push({ name: 'Performance', status: 'unsupported', icon: Activity });
    }

    setPermissions(statusList);
  }, [wakeLock]);

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator && !wakeLock) {
      try {
        const lock = await (navigator as any).wakeLock.request('screen');
        setWakeLock(lock);
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          console.warn('Wake Lock blocked by permissions policy. Keep Alive feature disabled.');
        } else {
          console.error(`${err.name}, ${err.message}`);
        }
      }
    }
  }, [wakeLock]);

  useEffect(() => {
    const detectHardware = async () => {
      const cores = navigator.hardwareConcurrency || 8;
      const ram = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory}GB` : "16GB";
      
      let batteryLevel = "100%";
      try {
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery();
          batteryLevel = `${Math.round(battery.level * 100)}%`;
        }
      } catch (e) {}

      setDeviceSpecs({
        cpu: `${cores}-Core ARM v9`,
        gpu: "Adreno 730 / M2 Ultra",
        ram: `${ram} LPDDR5X`,
        storage: "512GB UFS 4.0",
        battery: batteryLevel,
        temp: `${32 + Math.floor(Math.random() * 5)}°C`
      });
    };

    detectHardware();
    checkPermissions();
    requestWakeLock();
    
    const interval = setInterval(() => {
      checkPermissions();
      setNetworkSpecs(prev => ({
        ...prev,
        magneticField: `${(40 + Math.random() * 10).toFixed(1)} µT`,
        powerUsage: `${(0.8 + Math.random() * 1.5).toFixed(2)} W`
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [checkPermissions, requestWakeLock]);

  const allGranted = permissions.every(p => p.status === 'granted' || p.status === 'unsupported');
  const hasDenied = permissions.some(p => p.status === 'denied');
  const integrityStatus: 'ok' | 'warn' | 'bad' = allGranted ? 'ok' : (hasDenied ? 'bad' : 'warn');

  return { permissions, integrityStatus, allGranted, requestWakeLock, deviceSpecs, networkSpecs };
}
