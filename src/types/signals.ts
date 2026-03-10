
export type SignalCategory = 
  | 'global_news'
  | 'alerts'
  | 'youtube_video'
  | 'social_post'
  | 'jobs'
  | 'events'
  | 'businesses'
  | 'shopping'
  | 'real_estate'
  | 'delivery'
  | 'orbital_objects'
  | 'astronomy'
  | 'weather'
  | 'traffic'
  | 'system_operator';

export type RenderLayer = 'orbital' | 'planetary' | 'local';

export type MandatoryLevel = 'critical_alert' | 'major_global_news' | 'regional_important' | 'standard_mandatory' | 'none';

export interface SignalExplanation {
  matchedPreferences?: string[];
  mandatoryReason?: string;
  freshnessReason?: string;
  proximityReason?: string;
  selectionNote?: string;
  scoreBreakdown?: Record<string, number>;
}

export interface AstranovSignal {
  id: string;
  type: SignalCategory;
  title: string;
  description: string;
  lat: number;
  lng: number;
  geohash: string;
  source: string;
  sourceId: string;
  canonicalUrl?: string;
  authorId?: string;
  authorName?: string;
  tags?: string[];
  topicLabels?: string[];
  clusterId?: string;
  createdAt: number;
  priorityScore: number;
  relevanceScore: number;
  freshnessScore: number;
  renderLayer: RenderLayer;
  audienceScope: 'global' | 'regional' | 'local';
  duplicateHash: string;
  signalStatus: 'active' | 'archived' | 'suppressed';
  
  // Explainability
  explanation?: SignalExplanation;

  // Metadata for ranking
  metadata?: {
    popularity?: number;
    trustworthiness?: number;
    isMandatory?: boolean;
    mandatoryLevel?: MandatoryLevel;
    videoId?: string;
    thumbnailUrl?: string;
    categoryQuotas?: Record<string, number>;
  };
}

export interface UserSignalPreferences {
  userId: string;
  followedTopics: string[];
  blockedTopics: string[];
  preferredCategories: SignalCategory[];
  blockedCategories?: SignalCategory[];
  preferredSources?: string[];
  blockedSources?: string[];
  preferredCreators?: string[];
  blockedCreators?: string[];
  preferredLanguages: string[];
  followedCreators: string[];
  followedRegions: string[];
  sensitivityToAlerts: number; // 0-1
  contentDensityPreference: number; // 0-1
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  updatedAt: number;
}

export interface SignalCacheItem {
  sourceType: string;
  sourceId: string;
  fetchedAt: number;
  expiresAt: number;
  normalizedPayload: any;
  qualityScore: number;
}

export interface APIUsageLog {
  apiName: string;
  endpoint: string;
  timestamp: number;
  cost: number;
  status: string;
}

export interface IngestionCooldown {
  id: string; // e.g., "youtube_search_nyc"
  lastRun: number;
  nextAllowed: number;
}
