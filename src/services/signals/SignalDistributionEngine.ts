
import db, { safeFirestore } from '../../../firestore';
import { AstranovSignal, RenderLayer, UserSignalPreferences } from '../../types/signals';
import { SignalDeduplicationService } from './SignalDeduplicationService';
import { SignalPriorityEngine } from './SignalPriorityEngine';
import { SignalLayerPolicyService } from './SignalLayerPolicyService';
import { SignalDensityController } from './SignalDensityController';
import { SignalMixingEngine } from './SignalMixingEngine';
import { UserSignalPreferenceService } from './UserSignalPreferenceService';

export class SignalDistributionEngine {
  /**
   * Main entry point for getting signals for a specific viewport and zoom level.
   */
  static async getSignals(
    userId: string,
    layer: RenderLayer,
    bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number },
    userLat?: number,
    userLng?: number,
    zoomLevel: number = 5,
    viewportArea: number = 1.0
  ): Promise<AstranovSignal[]> {
    // 1. Fetch preferences
    const preferences = await UserSignalPreferenceService.getPreferences(userId);
    
    // 2. Fetch raw signals from multiple collections
    const rawSignals = await this.fetchRawSignals(layer, bounds);
    
    // 3. Calculate scores and enrich with explanations
    const enrichedSignals = rawSignals.map(signal => {
      const { score, explanation } = SignalPriorityEngine.calculateScore(signal, preferences, userLat, userLng);
      
      // Generate duplicate hash with refined logic
      const duplicateHash = SignalDeduplicationService.generateDuplicateHash(signal);

      return {
        ...signal,
        priorityScore: score,
        explanation,
        duplicateHash
      };
    });
    
    // 4. Deduplicate
    const uniqueSignals = SignalDeduplicationService.deduplicate(enrichedSignals);
    
    // 5. Filter by layer policy
    const allowedCategories = SignalLayerPolicyService.getCategoriesForLayer(layer);
    const filteredSignals = uniqueSignals.filter(s => allowedCategories.includes(s.type));
    
    // 6. Dynamic Density Control
    const totalCap = SignalDensityController.getAdaptiveMaxSignals(layer, zoomLevel, viewportArea, preferences);
    const categoryCaps = SignalDensityController.getCategoryCaps(layer, totalCap);
    
    // 7. Mix and balance using dynamic caps
    const mixedSignals = SignalMixingEngine.mixSignals(filteredSignals, layer, totalCap);
    
    return mixedSignals;
  }

  private static async fetchRawSignals(
    layer: RenderLayer,
    bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number }
  ): Promise<AstranovSignal[]> {
    return safeFirestore(async (firestore) => {
      const collections = ['orbital_signals', 'video_signals', 'map_signals', 'orbital_space_signals'];
      let allSignals: AstranovSignal[] = [];
      
      for (const collName of collections) {
        let query: any = firestore.collection(collName);
        const snapshot = await query.limit(100).get();
        
        const signals = snapshot.docs.map((doc: any) => {
          const data = doc.data();
          // Map existing fields to AstranovSignal
          return {
            id: doc.id,
            type: data.type || data.signalType || (collName === 'video_signals' ? 'youtube_video' : 'global_news'),
            title: data.title || 'Untitled Signal',
            description: data.description || '',
            lat: data.lat || 0,
            lng: data.lng || 0,
            geohash: data.geohash || '',
            source: data.sourceType || data.sourceCollection || 'unknown',
            sourceId: data.sourceId || data.videoId || doc.id,
            createdAt: data.createdAt || Date.now(),
            priorityScore: data.priorityScore || data.priority || 1.0,
            relevanceScore: 1.0,
            freshnessScore: data.freshnessScore || 1.0,
            renderLayer: layer,
            audienceScope: data.audienceScope || 'global',
            duplicateHash: data.duplicateHash || '',
            signalStatus: data.signalStatus || 'active',
            metadata: {
              isMandatory: data.metadata?.isMandatory || false,
              videoId: data.videoId,
              thumbnailUrl: data.thumbnailUrl,
              trustworthiness: data.metadata?.trustworthiness || 0.8,
              popularity: data.popularityScore || 0.5
            }
          } as AstranovSignal;
        });
        allSignals = [...allSignals, ...signals];
      }
      
      // In-memory bounds filtering if needed
      if (bounds) {
        allSignals = allSignals.filter(s => 
          s.lat >= bounds.minLat && s.lat <= bounds.maxLat &&
          s.lng >= bounds.minLng && s.lng <= bounds.maxLng
        );
      }
      
      return allSignals;
    }, [
      { id: 'mock_sig_1', type: 'youtube_video', title: 'Astranov Orbital Signal Alpha', description: 'Mock signal', lat: 40.7128, lng: -74.0060, geohash: 'dr5reg', source: 'video_signals', sourceId: 'sig_mock_1', createdAt: Date.now(), priorityScore: 1.0, relevanceScore: 1.0, freshnessScore: 1.0, renderLayer: layer, audienceScope: 'global', duplicateHash: 'hash1', signalStatus: 'active', metadata: { isMandatory: false, thumbnailUrl: 'https://picsum.photos/seed/astranov1/200/200', trustworthiness: 0.8, popularity: 0.8 } },
      { id: 'mock_sig_2', type: 'youtube_video', title: 'Astranov Orbital Signal Beta', description: 'Mock signal', lat: 34.0522, lng: -118.2437, geohash: '9q5ct', source: 'video_signals', sourceId: 'sig_mock_2', createdAt: Date.now(), priorityScore: 1.0, relevanceScore: 1.0, freshnessScore: 1.0, renderLayer: layer, audienceScope: 'global', duplicateHash: 'hash2', signalStatus: 'active', metadata: { isMandatory: false, thumbnailUrl: 'https://picsum.photos/seed/astranov2/200/200', trustworthiness: 0.8, popularity: 0.9 } },
      { id: 'mock_sig_3', type: 'global_news', title: 'Astranov Orbital Signal Gamma', description: 'Mock signal', lat: 51.5074, lng: -0.1278, geohash: 'gcpvj', source: 'video_signals', sourceId: 'sig_mock_3', createdAt: Date.now(), priorityScore: 1.0, relevanceScore: 1.0, freshnessScore: 1.0, renderLayer: layer, audienceScope: 'global', duplicateHash: 'hash3', signalStatus: 'active', metadata: { isMandatory: false, thumbnailUrl: 'https://picsum.photos/seed/astranov3/200/200', trustworthiness: 0.8, popularity: 0.7 } },
      { id: 'mock_sig_4', type: 'global_news', title: 'Astranov Orbital Signal Delta', description: 'Mock signal', lat: 35.6762, lng: 139.6503, geohash: 'xn774', source: 'video_signals', sourceId: 'sig_mock_4', createdAt: Date.now(), priorityScore: 1.0, relevanceScore: 1.0, freshnessScore: 1.0, renderLayer: layer, audienceScope: 'global', duplicateHash: 'hash4', signalStatus: 'active', metadata: { isMandatory: false, thumbnailUrl: 'https://picsum.photos/seed/astranov4/200/200', trustworthiness: 0.8, popularity: 0.95 } }
    ]);
  }
}
