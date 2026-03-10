import { OrderStatus, FulfillmentMethod } from './operational';

export interface YouTubeSignalMetadata {
  videoId: string;
  youtubeUrl: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  statistics?: {
    viewCount: string;
    likeCount: string;
  };
  contentDetails?: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
    contentRating: any;
    projection: string;
  };
  recordingDetails?: {
    location?: {
      latitude: number;
      longitude: number;
      altitude?: number;
    };
    recordingDate?: string;
  };
}

export interface VideoSignal extends YouTubeSignalMetadata {
  id: string;
  sourceType: 'youtube';
  createdAt: number;
  authorType: 'user' | 'harvester';
  authorId: string;
  signalType: 'video';
  visibility: 'public' | 'private' | 'friends';
  locationSource: 'recordingDetails' | 'text_geocoded' | 'channel_inferred' | 'user_supplied' | 'unresolved';
  lat: number;
  lng: number;
  geopoint: { latitude: number; longitude: number };
  geohash: string;
  regionKey: string;
  cityKey: string;
  engagementSummary: {
    views: number;
    likes: number;
    shares: number;
  };
  moderationStatus: 'pending' | 'approved' | 'rejected';
  embedAllowed: boolean;
  madeForKidsStatus?: boolean;
  previewDuration?: number;
  locationConfidence: number;
}

export interface OrbitalSignal {
  id: string;
  sourceCollection: 'video_signals';
  sourceId: string;
  type: 'video';
  title: string;
  thumbnailUrl: string;
  lat: number;
  lng: number;
  geohash: string;
  priority: number;
  renderMode: 'orbital' | 'map' | 'city';
  createdAt: number;
  freshnessScore: number;
  popularityScore: number;
}

export interface MapSignal {
  id: string;
  sourceCollection: 'video_signals';
  sourceId: string;
  type: 'video';
  title: string;
  thumbnailUrl: string;
  lat: number;
  lng: number;
  geopoint: { latitude: number; longitude: number };
  geohash: string;
  zoomBand: number;
  cityKey: string;
  regionKey: string;
  createdAt: number;
  status: 'active' | 'archived';
}

export interface IngestionJob {
  id: string;
  query: string;
  region: string;
  startedAt: number;
  finishedAt?: number;
  status: 'running' | 'completed' | 'failed';
  videosFetched: number;
  videosStored: number;
  errors: string[];
}

export interface UserVideoSubmission {
  id: string;
  userId: string;
  youtubeUrl: string;
  submittedAt: number;
  parseStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'unresolved';
  resultSignalId?: string;
  errors?: string[];
}
