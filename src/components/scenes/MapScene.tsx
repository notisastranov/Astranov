import React from 'react';
import Map from '../Map';

interface MapSceneWrapperProps {
  center: { lat: number; lng: number };
  zoom: number;
  onMapClick: (lat: number, lng: number, x: number, y: number) => void;
  onMapMove: (lat: number, lng: number, zoom: number) => void;
  mapType: 'roadmap' | 'satellite' | 'terrain' | 'hybrid' | 'dark' | 'earth';
  tasks: any[];
  shops: any[];
  publications: any[];
  users: any[];
  currentUserId: string | null;
  selectedLocation: { lat: number; lng: number } | null;
  groundingShops: any[];
  userRole: string;
  userId: string;
}

export const MapSceneWrapper: React.FC<MapSceneWrapperProps> = (props) => {
  return <Map {...props} />;
};
