
import { RenderLayer, SignalCategory } from '../../types/signals';

export class SignalLayerPolicyService {
  static getCategoriesForLayer(layer: RenderLayer): SignalCategory[] {
    switch (layer) {
      case 'orbital':
        return [
          'global_news',
          'alerts',
          'orbital_objects',
          'astronomy',
          'system_operator'
        ];
      case 'planetary':
        return [
          'global_news',
          'alerts',
          'youtube_video',
          'social_post',
          'events',
          'weather',
          'orbital_objects',
          'astronomy'
        ];
      case 'local':
        return [
          'alerts',
          'youtube_video',
          'social_post',
          'jobs',
          'events',
          'businesses',
          'shopping',
          'real_estate',
          'delivery',
          'weather',
          'traffic',
          'system_operator'
        ];
      default:
        return [];
    }
  }

  static getMinMandatoryRatio(layer: RenderLayer): number {
    switch (layer) {
      case 'orbital': return 0.3; // 30% mandatory
      case 'planetary': return 0.2;
      case 'local': return 0.1;
      default: return 0.1;
    }
  }
}
