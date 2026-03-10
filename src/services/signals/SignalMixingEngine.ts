
import { AstranovSignal, RenderLayer, SignalCategory } from '../../types/signals';
import { SignalLayerPolicyService } from './SignalLayerPolicyService';
import { SignalDensityController } from './SignalDensityController';

export class SignalMixingEngine {
  static mixSignals(
    signals: AstranovSignal[],
    layer: RenderLayer,
    maxSignals: number
  ): AstranovSignal[] {
    const minMandatoryRatio = SignalLayerPolicyService.getMinMandatoryRatio(layer);
    const minMandatoryCount = Math.floor(maxSignals * minMandatoryRatio);
    
    const mandatory = signals.filter(s => s.metadata?.isMandatory);
    const personalized = signals.filter(s => !s.metadata?.isMandatory && s.priorityScore > 0);
    
    // 1. Take top mandatory signals
    const selectedMandatory = mandatory
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, minMandatoryCount)
      .map(s => {
        if (!s.explanation) s.explanation = {};
        s.explanation.selectionNote = `Shown because mandatory quota reserved this slot (${s.metadata?.mandatoryLevel || 'standard'})`;
        return s;
      });
      
    // 2. Take top personalized signals for remaining slots
    const remainingSlots = maxSignals - selectedMandatory.length;
    const selectedPersonalized = personalized
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, remainingSlots)
      .map(s => {
        if (!s.explanation) s.explanation = {};
        if (!s.explanation.selectionNote) {
          s.explanation.selectionNote = `Shown because it matches your preferences and is highly relevant`;
        }
        return s;
      });
      
    // 3. Combine and apply category caps
    const combined = [...selectedMandatory, ...selectedPersonalized];
    const categoryCaps = SignalDensityController.getCategoryCaps(layer, maxSignals);
    const categoryCounts: Record<string, number> = {};
    
    return combined.filter(signal => {
      const cap = categoryCaps[signal.type];
      if (cap === undefined) return true;
      
      const current = categoryCounts[signal.type] || 0;
      if (current < cap) {
        categoryCounts[signal.type] = current + 1;
        return true;
      }
      return false;
    });
  }
}
