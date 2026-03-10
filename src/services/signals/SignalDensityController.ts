
import { AstranovSignal, RenderLayer, UserSignalPreferences } from '../../types/signals';

export class SignalDensityController {
  static getAdaptiveMaxSignals(
    layer: RenderLayer, 
    zoomLevel: number,
    viewportArea: number, // normalized area
    preferences: UserSignalPreferences | null
  ): number {
    // Base caps per layer
    let baseCap = 20;
    if (layer === 'planetary') baseCap = 50;
    if (layer === 'local') baseCap = 100;

    // 1. Zoom Multiplier (more zoom = more detail allowed)
    const zoomMultiplier = Math.max(0.5, Math.min(2.0, zoomLevel / 10));
    
    // 2. Viewport/Device Multiplier
    let deviceMultiplier = 1.0;
    if (preferences?.deviceType === 'mobile') deviceMultiplier = 0.6;
    if (preferences?.deviceType === 'tablet') deviceMultiplier = 0.8;
    
    // 3. User Preference Multiplier (0.0 to 1.0)
    const userMultiplier = 0.5 + (preferences?.contentDensityPreference || 0.5);

    const finalCap = Math.round(baseCap * zoomMultiplier * deviceMultiplier * userMultiplier);
    
    // Safety bounds
    return Math.max(10, Math.min(250, finalCap));
  }

  static getCategoryCaps(layer: RenderLayer, totalCap: number): Record<string, number> {
    // Proportional caps based on total capacity
    const ratios: Record<string, number> = {
      'youtube_video': 0.3,
      'social_post': 0.2,
      'global_news': 0.4,
      'alerts': 0.5 // Alerts can take up more space if needed
    };

    const caps: Record<string, number> = {};
    Object.entries(ratios).forEach(([cat, ratio]) => {
      caps[cat] = Math.max(3, Math.floor(totalCap * ratio));
    });

    return caps;
  }
}
