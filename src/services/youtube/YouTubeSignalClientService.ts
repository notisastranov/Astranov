import { VideoSignal, OrbitalSignal, MapSignal } from '../../types/youtube';

export class YouTubeSignalClientService {
  static async getOrbitalSignals(): Promise<OrbitalSignal[]> {
    const response = await fetch('/api/signals/orbital');
    if (!response.ok) throw new Error('Failed to fetch orbital signals');
    return response.json();
  }

  static async getMapSignals(regionKey?: string, cityKey?: string): Promise<MapSignal[]> {
    const params = new URLSearchParams();
    if (regionKey) params.append('regionKey', regionKey);
    if (cityKey) params.append('cityKey', cityKey);
    
    const response = await fetch(`/api/signals/map?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch map signals');
    return response.json();
  }

  static async getNearbySignals(lat: number, lng: number, radius: number = 5): Promise<VideoSignal[]> {
    const response = await fetch(`/api/signals/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    if (!response.ok) throw new Error('Failed to fetch nearby signals');
    return response.json();
  }

  static async getSignalDetails(signalId: string): Promise<VideoSignal> {
    const response = await fetch(`/api/signals/${signalId}`);
    if (!response.ok) throw new Error('Failed to fetch signal details');
    return response.json();
  }

  static async submitYouTubeUrl(youtubeUrl: string, userId: string, location?: { lat: number, lng: number }): Promise<{ success: boolean, signalId: string }> {
    const response = await fetch('/api/signals/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youtubeUrl, userId, ...location })
    });
    if (!response.ok) throw new Error('Failed to submit YouTube URL');
    return response.json();
  }
}
