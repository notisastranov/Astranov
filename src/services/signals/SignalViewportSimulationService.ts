
import { 
  AstranovSignal, 
  RenderLayer, 
  UserSignalPreferences, 
  SignalExplanation 
} from '../../types/signals';
import { SignalPriorityEngine } from './SignalPriorityEngine';
import { SignalDeduplicationService } from './SignalDeduplicationService';
import { SignalLayerPolicyService } from './SignalLayerPolicyService';
import { SignalDensityController } from './SignalDensityController';
import { SignalMixingEngine } from './SignalMixingEngine';
import { SIMULATION_FIXTURES } from './SignalSimulationFixtures';

export interface SimulationTrace {
  stage: string;
  count: number;
  dropped: { id: string; title: string; reason: string; score?: number }[];
}

export interface SimulationResult {
  scenarioName: string;
  metrics: {
    totalCandidates: number;
    afterDeduplication: number;
    afterLayerFiltering: number;
    afterCategoryBalancing: number;
    finalRenderedCount: number;
  };
  renderedSignals: AstranovSignal[];
  droppedSignals: { id: string; title: string; type: string; reason: string; stage: string; score?: number }[];
  trace: SimulationTrace[];
  validationErrors: string[];
}

export class SignalViewportSimulationService {
  static async runScenario(
    name: string,
    config: {
      layer: RenderLayer;
      zoomLevel: number;
      viewportArea: number;
      userLat?: number;
      userLng?: number;
      preferences: UserSignalPreferences;
      bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
      customSignals?: AstranovSignal[];
    }
  ): Promise<SimulationResult> {
    const { layer, zoomLevel, viewportArea, userLat, userLng, preferences, bounds, customSignals } = config;
    const candidates = customSignals || SIMULATION_FIXTURES;
    
    const trace: SimulationTrace[] = [];
    const droppedSignals: SimulationResult['droppedSignals'] = [];
    const validationErrors: string[] = [];

    // 1. Initial Fetch (Simulation)
    let currentSignals = [...candidates];
    trace.push({ stage: 'Initial Fetch', count: currentSignals.length, dropped: [] });

    // 2. Scoring & Explanation
    const enrichedSignals = currentSignals.map(signal => {
      const { score, explanation } = SignalPriorityEngine.calculateScore(signal, preferences, userLat, userLng);
      const duplicateHash = SignalDeduplicationService.generateDuplicateHash(signal);
      return {
        ...signal,
        priorityScore: score,
        explanation,
        duplicateHash
      };
    });

    // 3. Deduplication
    const deduplicated = SignalDeduplicationService.deduplicate(enrichedSignals);
    const dupDroppedIds = new Set(enrichedSignals.map(s => s.id).filter(id => !deduplicated.find(ds => ds.id === id)));
    
    const dupDropped = enrichedSignals.filter(s => dupDroppedIds.has(s.id)).map(s => ({
      id: s.id,
      title: s.title,
      type: s.type,
      reason: 'Duplicate content detected',
      stage: 'Deduplication',
      score: s.priorityScore
    }));
    droppedSignals.push(...dupDropped);
    trace.push({ stage: 'Deduplication', count: deduplicated.length, dropped: dupDropped });

    // 4. Layer Filtering
    const allowedCategories = SignalLayerPolicyService.getCategoriesForLayer(layer);
    const layerFiltered = deduplicated.filter(s => allowedCategories.includes(s.type));
    
    const layerDropped = deduplicated.filter(s => !allowedCategories.includes(s.type)).map(s => ({
      id: s.id,
      title: s.title,
      type: s.type,
      reason: `Category ${s.type} not allowed on ${layer} layer`,
      stage: 'Layer Filtering',
      score: s.priorityScore
    }));
    droppedSignals.push(...layerDropped);
    trace.push({ stage: 'Layer Filtering', count: layerFiltered.length, dropped: layerDropped });

    // 5. Bounds Filtering
    let boundsFiltered = layerFiltered;
    if (bounds) {
      boundsFiltered = layerFiltered.filter(s => 
        s.lat >= bounds.minLat && s.lat <= bounds.maxLat &&
        s.lng >= bounds.minLng && s.lng <= bounds.maxLng
      );
      const boundsDropped = layerFiltered.filter(s => !boundsFiltered.find(bs => bs.id === s.id)).map(s => ({
        id: s.id,
        title: s.title,
        type: s.type,
        reason: 'Outside viewport bounds',
        stage: 'Bounds Filtering',
        score: s.priorityScore
      }));
      droppedSignals.push(...boundsDropped);
      trace.push({ stage: 'Bounds Filtering', count: boundsFiltered.length, dropped: boundsDropped });
    }

    // 6. Density Control & Mixing
    const totalCap = SignalDensityController.getAdaptiveMaxSignals(layer, zoomLevel, viewportArea, preferences);
    const mixedSignals = SignalMixingEngine.mixSignals(boundsFiltered, layer, totalCap);
    
    const mixDropped = boundsFiltered.filter(s => !mixedSignals.find(ms => ms.id === s.id)).map(s => ({
      id: s.id,
      title: s.title,
      type: s.type,
      reason: 'Density cap or category balancing',
      stage: 'Mixing & Density',
      score: s.priorityScore
    }));
    droppedSignals.push(...mixDropped);
    trace.push({ stage: 'Mixing & Density', count: mixedSignals.length, dropped: mixDropped });

    // 7. Validation
    this.validate(mixedSignals, config, validationErrors);

    return {
      scenarioName: name,
      metrics: {
        totalCandidates: candidates.length,
        afterDeduplication: deduplicated.length,
        afterLayerFiltering: layerFiltered.length,
        afterCategoryBalancing: mixedSignals.length,
        finalRenderedCount: mixedSignals.length
      },
      renderedSignals: mixedSignals,
      droppedSignals,
      trace,
      validationErrors
    };
  }

  private static validate(signals: AstranovSignal[], config: any, errors: string[]) {
    const { preferences, layer } = config;

    // Rule: Mandatory signals must survive when truly critical
    const criticalMissing = SIMULATION_FIXTURES.filter(f => 
      f.metadata?.mandatoryLevel === 'critical_alert' && 
      !signals.find(s => s.id === f.id)
    );
    if (criticalMissing.length > 0) {
      errors.push(`CRITICAL FAILURE: Mandatory alert ${criticalMissing[0].title} was dropped!`);
    }

    // Rule: Blocked categories must not dominate (should be 0 unless mandatory)
    const blockedFound = signals.filter(s => 
      preferences.blockedCategories?.includes(s.type) && 
      !s.metadata?.isMandatory
    );
    if (blockedFound.length > 0) {
      errors.push(`VALIDATION ERROR: Blocked category ${blockedFound[0].type} found in results.`);
    }

    // Rule: Blocked topics must be suppressed
    const blockedTopicFound = signals.filter(s => {
      if (s.metadata?.isMandatory) return false;
      const tokens = new Set([...(s.tags || []), ...s.title.toLowerCase().split(/\s+/)]);
      return preferences.blockedTopics.some(t => tokens.has(t.toLowerCase()));
    });
    if (blockedTopicFound.length > 0) {
      errors.push(`VALIDATION ERROR: Signal "${blockedTopicFound[0].title}" contains blocked topics.`);
    }

    // Rule: Mobile density must be reduced
    if (preferences.deviceType === 'mobile') {
      const desktopCap = SignalDensityController.getAdaptiveMaxSignals(layer, config.zoomLevel, config.viewportArea, { ...preferences, deviceType: 'desktop' });
      const mobileCap = SignalDensityController.getAdaptiveMaxSignals(layer, config.zoomLevel, config.viewportArea, preferences);
      if (mobileCap >= desktopCap) {
        errors.push(`DENSITY WARNING: Mobile cap (${mobileCap}) is not lower than desktop cap (${desktopCap}).`);
      }
    }
  }
}
