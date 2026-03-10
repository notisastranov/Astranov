
import { AstranovSignal } from '../../types/signals';

export const SIMULATION_FIXTURES: AstranovSignal[] = [
  // GLOBAL NEWS
  {
    id: 'news-global-1',
    type: 'global_news',
    title: 'Global Economic Summit Reaches Historic Agreement',
    description: 'Leaders from 20 nations agree on a new framework for sustainable trade and carbon taxation.',
    lat: 48.8566, lng: 2.3522, // Paris
    geohash: 'u09tv',
    source: 'reuters',
    sourceId: 'reuters-1',
    createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2h ago
    priorityScore: 0, relevanceScore: 0, freshnessScore: 0,
    renderLayer: 'orbital',
    audienceScope: 'global',
    duplicateHash: 'news-summit-2026',
    signalStatus: 'active',
    metadata: { isMandatory: true, mandatoryLevel: 'major_global_news', trustworthiness: 0.95, popularity: 0.9 }
  },
  {
    id: 'news-global-2',
    type: 'global_news',
    title: 'New Breakthrough in Fusion Energy Research',
    description: 'Scientists achieve net energy gain for the third time this month, signaling commercial viability.',
    lat: 37.4275, lng: -122.1697, // Stanford
    geohash: '9q9hv',
    source: 'associated_press',
    sourceId: 'ap-1',
    createdAt: Date.now() - 1000 * 60 * 60 * 5, // 5h ago
    priorityScore: 0, relevanceScore: 0, freshnessScore: 0,
    renderLayer: 'orbital',
    audienceScope: 'global',
    duplicateHash: 'fusion-breakthrough',
    signalStatus: 'active',
    metadata: { isMandatory: false, trustworthiness: 0.9, popularity: 0.85 }
  },

  // EMERGENCY ALERTS
  {
    id: 'alert-emergency-1',
    type: 'alerts',
    title: 'CRITICAL: Severe Weather Warning - Mediterranean Basin',
    description: 'Intense storm system approaching. High winds and flooding expected in coastal regions.',
    lat: 36.4341, lng: 28.2175, // Rhodes
    geohash: 'sw8m',
    source: 'noaa',
    sourceId: 'noaa-alert-1',
    createdAt: Date.now() - 1000 * 60 * 15, // 15m ago
    priorityScore: 0, relevanceScore: 0, freshnessScore: 0,
    renderLayer: 'orbital',
    audienceScope: 'regional',
    duplicateHash: 'med-storm-2026',
    signalStatus: 'active',
    metadata: { isMandatory: true, mandatoryLevel: 'critical_alert', trustworthiness: 1.0, popularity: 1.0 }
  },

  // YOUTUBE VIDEOS (Rhodes)
  {
    id: 'yt-rhodes-1',
    type: 'youtube_video',
    title: 'Hidden Gems of Rhodes Old Town',
    description: 'Exploring the medieval streets and secret courtyards of Rhodes.',
    lat: 36.4452, lng: 28.2278,
    geohash: 'sw8m',
    source: 'youtube',
    sourceId: 'videoId_rhodes_1',
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1d ago
    priorityScore: 0, relevanceScore: 0, freshnessScore: 0,
    renderLayer: 'local',
    audienceScope: 'local',
    duplicateHash: 'yt-rhodes-gems',
    signalStatus: 'active',
    metadata: { videoId: 'videoId_rhodes_1', thumbnailUrl: 'https://picsum.photos/seed/rhodes1/320/180', trustworthiness: 0.8, popularity: 0.6 }
  },
  {
    id: 'yt-rhodes-2',
    type: 'youtube_video',
    title: 'Best Coffee in Rhodes: My Top 5 Spots',
    description: 'A tour of the best specialty coffee shops in Rhodes city.',
    lat: 36.4430, lng: 28.2250,
    geohash: 'sw8m',
    source: 'youtube',
    sourceId: 'videoId_rhodes_2',
    createdAt: Date.now() - 1000 * 60 * 60 * 48, // 2d ago
    priorityScore: 0, relevanceScore: 0, freshnessScore: 0,
    renderLayer: 'local',
    audienceScope: 'local',
    duplicateHash: 'yt-rhodes-coffee',
    signalStatus: 'active',
    metadata: { videoId: 'videoId_rhodes_2', thumbnailUrl: 'https://picsum.photos/seed/rhodes2/320/180', trustworthiness: 0.8, popularity: 0.5 }
  },

  // DUPLICATES (Tokyo)
  {
    id: 'yt-tokyo-dup-1',
    type: 'youtube_video',
    title: 'Tokyo Night Walk - Shinjuku 2026',
    description: 'Walking through the neon streets of Shinjuku at night.',
    lat: 35.6905, lng: 139.7005,
    geohash: 'xn77',
    source: 'youtube',
    sourceId: 'tokyo_walk_1',
    createdAt: Date.now() - 1000 * 60 * 60 * 1, // 1h ago
    priorityScore: 0, relevanceScore: 0, freshnessScore: 0,
    renderLayer: 'local',
    audienceScope: 'local',
    duplicateHash: 'tokyo-night-walk-shinjuku',
    signalStatus: 'active',
    metadata: { videoId: 'tokyo_walk_1', trustworthiness: 0.9, popularity: 0.95 }
  },
  {
    id: 'yt-tokyo-dup-2',
    type: 'youtube_video',
    title: 'Shinjuku Night Walk (4K HDR)',
    description: 'Experience the lights of Tokyo in stunning 4K.',
    lat: 35.6906, lng: 139.7006,
    geohash: 'xn77',
    source: 'youtube',
    sourceId: 'tokyo_walk_1', // SAME VIDEO ID
    createdAt: Date.now() - 1000 * 60 * 60 * 1.5,
    priorityScore: 0, relevanceScore: 0, freshnessScore: 0,
    renderLayer: 'local',
    audienceScope: 'local',
    duplicateHash: 'tokyo-night-walk-shinjuku',
    signalStatus: 'active',
    metadata: { videoId: 'tokyo_walk_1', trustworthiness: 0.85, popularity: 0.9 }
  },

  // BUSINESSES (Rhodes)
  {
    id: 'biz-rhodes-1',
    type: 'businesses',
    title: 'The Medieval Mill',
    description: 'Authentic Greek cuisine in a historic setting.',
    lat: 36.4440, lng: 28.2260,
    geohash: 'sw8m',
    source: 'astranov_merchants',
    sourceId: 'biz_1',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    priorityScore: 0, relevanceScore: 0, freshnessScore: 0,
    renderLayer: 'local',
    audienceScope: 'local',
    duplicateHash: 'biz-medieval-mill',
    signalStatus: 'active',
    metadata: { trustworthiness: 0.9, popularity: 0.7 }
  },

  // ORBITAL SPACE OBJECTS
  {
    id: 'space-comet-1',
    type: 'astronomy',
    title: 'Comet C/2026 A1 (Astranov)',
    description: 'A newly discovered comet visible in the northern hemisphere.',
    lat: 0, lng: 0, // Space objects might not have fixed lat/lng on Earth
    geohash: 'space',
    source: 'nasa_jpl',
    sourceId: 'comet_1',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    priorityScore: 0, relevanceScore: 0, freshnessScore: 0,
    renderLayer: 'orbital',
    audienceScope: 'global',
    duplicateHash: 'comet-2026-a1',
    signalStatus: 'active',
    metadata: { trustworthiness: 1.0, popularity: 0.8 }
  },
  {
    id: 'space-station-1',
    type: 'orbital_objects',
    title: 'ISS Pass Over Your Location',
    description: 'The International Space Station will be visible in 15 minutes.',
    lat: 36.4341, lng: 28.2175,
    geohash: 'sw8m',
    source: 'heavens_above',
    sourceId: 'iss_pass_1',
    createdAt: Date.now(),
    priorityScore: 0, relevanceScore: 0, freshnessScore: 0,
    renderLayer: 'orbital',
    audienceScope: 'local',
    duplicateHash: 'iss-pass-now',
    signalStatus: 'active',
    metadata: { trustworthiness: 1.0, popularity: 0.9 }
  },

  // BLOCKED TOPICS (Politics)
  {
    id: 'news-politics-1',
    type: 'global_news',
    title: 'Election Results: New Prime Minister Announced',
    description: 'The final votes have been counted in the national election.',
    lat: 51.5074, lng: -0.1278, // London
    geohash: 'gcpv',
    source: 'bbc',
    sourceId: 'bbc-politics-1',
    createdAt: Date.now() - 1000 * 60 * 60 * 1,
    priorityScore: 0, relevanceScore: 0, freshnessScore: 0,
    renderLayer: 'planetary',
    audienceScope: 'global',
    duplicateHash: 'election-2026',
    signalStatus: 'active',
    tags: ['politics', 'election'],
    metadata: { isMandatory: false, trustworthiness: 0.9, popularity: 0.95 }
  }
];
