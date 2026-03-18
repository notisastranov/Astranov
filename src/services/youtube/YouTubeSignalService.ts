import firestore, { safeFirestore, isFirestoreDisabled } from '../../../firestore';
import { OrbitalSignal, MapSignal, VideoSignal } from '../../types/youtube';
import { GeoIndexService } from './GeoIndexService';

export class YouTubeSignalService {
  /**
   * Fetches orbital signals for the globe scene.
   * @param limit Maximum signals to return
   * @returns Array of orbital signals
   */
  static async getOrbitalSignals(limit: number = 100): Promise<OrbitalSignal[]> {
    return safeFirestore(async (db) => {
      const snapshot = await db.collection('orbital_signals')
        .orderBy('priority', 'desc')
        .limit(limit)
        .get();

      const signals = snapshot.docs.map(doc => doc.data() as OrbitalSignal);
      // Deduplicate by ID to prevent frontend key warnings
      return Array.from(new Map(signals.map(s => [s.id, s])).values());
    }, this.getMockOrbitalSignals(limit));
  }

  private static getMockOrbitalSignals(limit: number): OrbitalSignal[] {
    const mockSignals: OrbitalSignal[] = [
      { id: 'orb_mock_1', sourceCollection: 'video_signals', sourceId: 'sig_mock_1', type: 'video', title: 'Astranov Orbital Signal Alpha', thumbnailUrl: 'https://picsum.photos/seed/astranov1/200/200', lat: 40.7128, lng: -74.0060, geohash: 'dr5reg', priority: 1, renderMode: 'orbital', createdAt: Date.now(), freshnessScore: 1.0, popularityScore: 0.8 },
      { id: 'orb_mock_2', sourceCollection: 'video_signals', sourceId: 'sig_mock_2', type: 'video', title: 'Astranov Orbital Signal Beta', thumbnailUrl: 'https://picsum.photos/seed/astranov2/200/200', lat: 34.0522, lng: -118.2437, geohash: '9q5ct', priority: 1, renderMode: 'orbital', createdAt: Date.now(), freshnessScore: 1.0, popularityScore: 0.9 },
      { id: 'orb_mock_3', sourceCollection: 'video_signals', sourceId: 'sig_mock_3', type: 'video', title: 'Astranov Orbital Signal Gamma', thumbnailUrl: 'https://picsum.photos/seed/astranov3/200/200', lat: 51.5074, lng: -0.1278, geohash: 'gcpvj', priority: 1, renderMode: 'orbital', createdAt: Date.now(), freshnessScore: 1.0, popularityScore: 0.7 },
      { id: 'orb_mock_4', sourceCollection: 'video_signals', sourceId: 'sig_mock_4', type: 'video', title: 'Astranov Orbital Signal Delta', thumbnailUrl: 'https://picsum.photos/seed/astranov4/200/200', lat: 35.6762, lng: 139.6503, geohash: 'xn774', priority: 1, renderMode: 'orbital', createdAt: Date.now(), freshnessScore: 1.0, popularityScore: 0.95 },
    ];
    return mockSignals.slice(0, limit);
  }

  /**
   * Fetches map signals for a given region or city.
   * @param regionKey Optional region key
   * @param cityKey Optional city key
   * @param limit Maximum signals to return
   * @returns Array of map signals
   */
  static async getMapSignals(regionKey?: string, cityKey?: string, limit: number = 50): Promise<MapSignal[]> {
    return safeFirestore(async (db) => {
      let query = db.collection('map_signals').where('status', '==', 'active');

      if (cityKey) {
        query = query.where('cityKey', '==', cityKey);
      } else if (regionKey) {
        query = query.where('regionKey', '==', regionKey);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').limit(limit).get();
      const signals = snapshot.docs.map(doc => doc.data() as MapSignal);
      // Deduplicate by ID to prevent frontend key warnings
      return Array.from(new Map(signals.map(s => [s.id, s])).values());
    }, [
      { id: 'map_mock_1', sourceCollection: 'video_signals', sourceId: 'sig_mock_1', type: 'video', title: 'Local Event Alpha', thumbnailUrl: 'https://picsum.photos/seed/map1/200/200', lat: 40.7128, lng: -74.0060, geohash: 'dr5reg', priority: 1, renderMode: 'planetary', createdAt: Date.now(), freshnessScore: 1.0, popularityScore: 0.8 },
      { id: 'map_mock_2', sourceCollection: 'video_signals', sourceId: 'sig_mock_2', type: 'video', title: 'Local Event Beta', thumbnailUrl: 'https://picsum.photos/seed/map2/200/200', lat: 34.0522, lng: -118.2437, geohash: '9q5ct', priority: 1, renderMode: 'planetary', createdAt: Date.now(), freshnessScore: 1.0, popularityScore: 0.9 },
    ]);
  }

  /**
   * Fetches nearby video signals based on coordinates and radius.
   * @param lat Latitude
   * @param lng Longitude
   * @param radiusInKm Radius in kilometers
   * @returns Array of video signals
   */
  static async getNearbySignals(lat: number, lng: number, radiusInKm: number): Promise<VideoSignal[]> {
    return safeFirestore(async (db) => {
      const ranges = GeoIndexService.getGeohashRanges(lat, lng, radiusInKm);
      const signals: VideoSignal[] = [];

      for (const [start, end] of ranges) {
        const snapshot = await db.collection('video_signals')
          .where('geohash', '>=', start)
          .where('geohash', '<=', end)
          .limit(20)
          .get();

        snapshot.docs.forEach(doc => signals.push(doc.data() as VideoSignal));
      }

      // Deduplicate by ID to prevent frontend key warnings (crucial for geohash range queries)
      const uniqueSignals = Array.from(new Map(signals.map(s => [s.id, s])).values());
      return uniqueSignals;
    }, [
      { id: 'nearby_mock_1', type: 'video', title: 'Nearby Activity 1', description: 'Something happening nearby', lat: lat + 0.001, lng: lng + 0.001, geohash: 'mock', source: 'youtube', sourceId: 'mock1', authorId: 'mock_author', createdAt: Date.now(), priorityScore: 5, renderLayer: 'local', audienceScope: 'local', signalStatus: 'active', metadata: { trustworthiness: 0.9, popularity: 0.8 } },
      { id: 'nearby_mock_2', type: 'video', title: 'Nearby Activity 2', description: 'Another thing happening nearby', lat: lat - 0.001, lng: lng - 0.001, geohash: 'mock', source: 'youtube', sourceId: 'mock2', authorId: 'mock_author', createdAt: Date.now(), priorityScore: 4, renderLayer: 'local', audienceScope: 'local', signalStatus: 'active', metadata: { trustworthiness: 0.8, popularity: 0.7 } }
    ]);
  }

  /**
   * Fetches full details for a video signal.
   * @param signalId Video signal ID
   * @returns Video signal details
   */
  static async getSignalDetails(signalId: string): Promise<VideoSignal | null> {
    return safeFirestore(async (db) => {
      const doc = await db.collection('video_signals').doc(signalId).get();
      return doc.exists ? doc.data() as VideoSignal : null;
    }, null);
  }
}
