import axios from 'axios';
import { YouTubeSignalMetadata } from '../../types/youtube';

export class YouTubeBackendService {
  private static API_KEY = process.env.YOUTUBE_API_KEY;

  /**
   * Fetches metadata for a single YouTube video.
   * @param videoId YouTube video ID
   * @returns YouTube video metadata
   */
  static async getVideoMetadata(videoId: string): Promise<YouTubeSignalMetadata> {
    if (!this.API_KEY) {
      throw new Error("YouTube API Key missing in environment variables.");
    }

    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos`,
        {
          params: {
            part: 'snippet,contentDetails,statistics,recordingDetails',
            id: videoId,
            key: this.API_KEY
          }
        }
      );

      const data = response.data;
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        return {
          videoId: item.id,
          youtubeUrl: `https://www.youtube.com/watch?v=${item.id}`,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          statistics: item.statistics,
          contentDetails: item.contentDetails,
          recordingDetails: item.recordingDetails
        };
      }
      throw new Error("Video not found on YouTube.");
    } catch (error: any) {
      console.error("Error fetching YouTube metadata:", error.message);
      throw error;
    }
  }

  /**
   * Searches for YouTube videos based on a query and location.
   * @param query Search query
   * @param region Optional region code (e.g., 'US')
   * @param maxResults Maximum results to return (default 50)
   * @returns Array of YouTube video metadata
   */
  static async searchVideos(query: string, region?: string, maxResults: number = 50): Promise<YouTubeSignalMetadata[]> {
    if (!this.API_KEY) {
      throw new Error("YouTube API Key missing in environment variables.");
    }

    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            part: 'snippet',
            q: query,
            type: 'video',
            regionCode: region,
            maxResults,
            key: this.API_KEY
          }
        }
      );

      const searchItems = response.data.items;
      if (!searchItems || searchItems.length === 0) return [];

      const videoIds = searchItems.map((item: any) => item.id.videoId).join(',');
      
      // Fetch full metadata for search results
      return this.getVideosMetadata(videoIds);
    } catch (error: any) {
      console.error("Error searching YouTube videos:", error.message);
      throw error;
    }
  }

  /**
   * Fetches metadata for multiple YouTube videos.
   * @param videoIds Comma-separated YouTube video IDs
   * @returns Array of YouTube video metadata
   */
  static async getVideosMetadata(videoIds: string): Promise<YouTubeSignalMetadata[]> {
    if (!this.API_KEY) {
      throw new Error("YouTube API Key missing in environment variables.");
    }

    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos`,
        {
          params: {
            part: 'snippet,contentDetails,statistics,recordingDetails',
            id: videoIds,
            key: this.API_KEY
          }
        }
      );

      const items = response.data.items;
      return items.map((item: any) => ({
        videoId: item.id,
        youtubeUrl: `https://www.youtube.com/watch?v=${item.id}`,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        statistics: item.statistics,
        contentDetails: item.contentDetails,
        recordingDetails: item.recordingDetails
      }));
    } catch (error: any) {
      console.error("Error fetching YouTube videos metadata:", error.message);
      throw error;
    }
  }

  /**
   * Extracts the video ID from a YouTube URL.
   * @param url YouTube URL
   * @returns Video ID or null
   */
  static extractVideoId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  }
}
