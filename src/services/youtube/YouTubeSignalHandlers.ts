import { YouTubeSignalService } from './YouTubeSignalService';
import { YouTubeBackendService } from './YouTubeBackendService';
import { YouTubeSignalHarvester } from './YouTubeSignalHarvester';
import { VideoSignal } from '../../types/youtube';

export class YouTubeSignalHandlers {
  /**
   * Searches for nearby YouTube signals based on location and radius.
   * @param lat Latitude
   * @param lng Longitude
   * @param radiusInKm Radius in kilometers (default 5)
   * @returns Array of nearby video signals
   */
  static async searchNearbyVideos(lat: number, lng: number, radiusInKm: number = 5): Promise<VideoSignal[]> {
    return YouTubeSignalService.getNearbySignals(lat, lng, radiusInKm);
  }

  /**
   * Searches for YouTube signals in a specific region.
   * @param regionKey Region key
   * @returns Array of video signals in the region
   */
  static async searchRegionalVideos(regionKey: string): Promise<any[]> {
    return YouTubeSignalService.getMapSignals(regionKey);
  }

  /**
   * Fetches full details for a video signal.
   * @param signalId Video signal ID
   * @returns Video signal details
   */
  static async getVideoSignalDetails(signalId: string): Promise<VideoSignal | null> {
    return YouTubeSignalService.getSignalDetails(signalId);
  }

  /**
   * Creates a video signal from a YouTube URL.
   * @param youtubeUrl YouTube URL
   * @param userId User ID
   * @param optionalLocation Optional location (lat, lng)
   */
  static async createVideoSignalFromUrl(youtubeUrl: string, userId: string, optionalLocation?: { lat: number, lng: number }): Promise<string> {
    const videoId = YouTubeBackendService.extractVideoId(youtubeUrl);
    if (!videoId) throw new Error("Invalid YouTube URL.");

    const metadata = await YouTubeBackendService.getVideoMetadata(videoId);
    
    // If optional location is provided, override recording details
    if (optionalLocation) {
      metadata.recordingDetails = {
        location: {
          latitude: optionalLocation.lat,
          longitude: optionalLocation.lng
        }
      };
    }

    return YouTubeSignalHarvester.processVideo(metadata, 'user', userId);
  }

  /**
   * Fetches trending video signals based on scope.
   * @param scope Scope (global, regional, local)
   * @returns Array of trending video signals
   */
  static async getTrendingVideoSignals(scope: 'global' | 'regional' | 'local'): Promise<any[]> {
    // For now, return top orbital signals
    return YouTubeSignalService.getOrbitalSignals(20);
  }
}
