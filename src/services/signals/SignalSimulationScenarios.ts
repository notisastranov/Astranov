
import { SignalViewportSimulationService, SimulationResult } from './SignalViewportSimulationService';
import { UserSignalPreferences } from '../../types/signals';

const DEFAULT_PREFS: UserSignalPreferences = {
  userId: 'test-user',
  followedTopics: [],
  blockedTopics: [],
  preferredCategories: [],
  blockedCategories: [],
  followedCreators: [],
  followedRegions: [],
  preferredSources: [],
  preferredLanguages: ['en'],
  sensitivityToAlerts: 0.5,
  contentDensityPreference: 0.5,
  deviceType: 'desktop',
  updatedAt: Date.now()
};

export class SignalSimulationScenarios {
  static async runAll(): Promise<SimulationResult[]> {
    return Promise.all([
      this.scenarioA(),
      this.scenarioB(),
      this.scenarioC(),
      this.scenarioD(),
      this.scenarioE(),
      this.scenarioF(),
      this.scenarioG(),
      this.scenarioH()
    ]);
  }

  static async scenarioA(): Promise<SimulationResult> {
    return SignalViewportSimulationService.runScenario('SCENARIO A — Orbital Europe', {
      layer: 'orbital',
      zoomLevel: 4,
      viewportArea: 10.0,
      userLat: 48.8566, userLng: 2.3522, // Paris
      preferences: {
        ...DEFAULT_PREFS,
        followedTopics: ['travel', 'food', 'world events'],
        blockedTopics: ['celebrity gossip']
      }
    });
  }

  static async scenarioB(): Promise<SimulationResult> {
    return SignalViewportSimulationService.runScenario('SCENARIO B — Local Rhodes', {
      layer: 'local',
      zoomLevel: 15,
      viewportArea: 0.05,
      userLat: 36.4452, userLng: 28.2278, // Rhodes
      preferences: {
        ...DEFAULT_PREFS,
        deviceType: 'mobile',
        followedTopics: ['coffee', 'restaurants', 'local videos', 'events']
      }
    });
  }

  static async scenarioC(): Promise<SimulationResult> {
    return SignalViewportSimulationService.runScenario('SCENARIO C — Politics-blocked user', {
      layer: 'planetary',
      zoomLevel: 8,
      viewportArea: 1.0,
      preferences: {
        ...DEFAULT_PREFS,
        blockedTopics: ['politics', 'war'],
        followedTopics: ['travel', 'food', 'architecture']
      }
    });
  }

  static async scenarioD(): Promise<SimulationResult> {
    return SignalViewportSimulationService.runScenario('SCENARIO D — Emergency override', {
      layer: 'orbital',
      zoomLevel: 5,
      viewportArea: 5.0,
      preferences: {
        ...DEFAULT_PREFS,
        followedTopics: ['entertainment', 'travel']
      }
    });
  }

  static async scenarioE(): Promise<SimulationResult> {
    return SignalViewportSimulationService.runScenario('SCENARIO E — High-density Tokyo video region', {
      layer: 'local',
      zoomLevel: 14,
      viewportArea: 0.1,
      userLat: 35.6905, userLng: 139.7005, // Tokyo
      preferences: DEFAULT_PREFS
    });
  }

  static async scenarioF(): Promise<SimulationResult> {
    return SignalViewportSimulationService.runScenario('SCENARIO F — Low-end mobile device', {
      layer: 'local',
      zoomLevel: 14,
      viewportArea: 0.1,
      preferences: {
        ...DEFAULT_PREFS,
        deviceType: 'mobile',
        contentDensityPreference: 0.2
      }
    });
  }

  static async scenarioG(): Promise<SimulationResult> {
    return SignalViewportSimulationService.runScenario('SCENARIO G — Signal duplication test', {
      layer: 'local',
      zoomLevel: 14,
      viewportArea: 0.1,
      preferences: DEFAULT_PREFS
    });
  }

  static async scenarioH(): Promise<SimulationResult> {
    return SignalViewportSimulationService.runScenario('SCENARIO H — Mixed orbital space objects', {
      layer: 'orbital',
      zoomLevel: 3,
      viewportArea: 20.0,
      preferences: DEFAULT_PREFS
    });
  }
}
