import { YouTubeSignalMetadata } from '../../types/youtube';

export interface LocationResolutionResult {
  lat: number;
  lng: number;
  confidence: number;
  source: 'recordingDetails' | 'text_geocoded' | 'channel_inferred' | 'user_supplied' | 'unresolved';
}

export class LocationResolutionService {
  /**
   * Resolves the location of a YouTube video based on its metadata.
   * @param metadata YouTube video metadata
   * @returns Location resolution result
   */
  static async resolveLocation(metadata: YouTubeSignalMetadata): Promise<LocationResolutionResult> {
    // 1. Check recordingDetails.location
    if (metadata.recordingDetails?.location) {
      return {
        lat: metadata.recordingDetails.location.latitude,
        lng: metadata.recordingDetails.location.longitude,
        confidence: 1.0,
        source: 'recordingDetails'
      };
    }

    // 2. Parse title and description for place names
    const textLocation = await this.parseTextForLocation(metadata.title, metadata.description);
    if (textLocation) {
      return {
        lat: textLocation.lat,
        lng: textLocation.lng,
        confidence: 0.8,
        source: 'text_geocoded'
      };
    }

    // 3. Infer from channel or metadata keywords (e.g., "Tokyo", "London")
    const inferredLocation = await this.inferLocation(metadata.channelTitle, metadata.description);
    if (inferredLocation) {
      return {
        lat: inferredLocation.lat,
        lng: inferredLocation.lng,
        confidence: 0.5,
        source: 'channel_inferred'
      };
    }

    // 4. Fallback to unresolved
    return {
      lat: 0,
      lng: 0,
      confidence: 0,
      source: 'unresolved'
    };
  }

  private static async parseTextForLocation(title: string, description: string): Promise<{ lat: number, lng: number } | null> {
    // Simple keyword matching for major cities for now
    // In a real implementation, this would use a geocoding service or LLM
    const text = (title + ' ' + description).toLowerCase();
    
    const cities: { [key: string]: { lat: number, lng: number } } = {
      'tokyo': { lat: 35.6762, lng: 139.6503 },
      'london': { lat: 51.5074, lng: -0.1278 },
      'new york': { lat: 40.7128, lng: -74.0060 },
      'paris': { lat: 48.8566, lng: 2.3522 },
      'berlin': { lat: 52.5200, lng: 13.4050 },
      'san francisco': { lat: 37.7749, lng: -122.4194 },
      'singapore': { lat: 1.3521, lng: 103.8198 },
      'sydney': { lat: -33.8688, lng: 151.2093 },
      'dubai': { lat: 25.2048, lng: 55.2708 },
      'los angeles': { lat: 34.0522, lng: -118.2437 }
    };

    for (const [city, coords] of Object.entries(cities)) {
      if (text.includes(city)) {
        return coords;
      }
    }

    return null;
  }

  private static async inferLocation(channelTitle: string, description: string): Promise<{ lat: number, lng: number } | null> {
    // Similar to parseTextForLocation, but with lower confidence
    return this.parseTextForLocation(channelTitle, '');
  }
}
