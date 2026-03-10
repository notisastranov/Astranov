
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
    }, []);
  }
}
