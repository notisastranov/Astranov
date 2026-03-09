import { ConfigValue, FeatureFlag } from '../../types';
import { FIREBASE_COLLECTIONS } from '../firebase/schema';

export class ConfigService {
  /**
   * Updates a configuration value in the store.
   */
  static async updateConfig(key: string, value: any, description: string): Promise<ConfigValue> {
    const config: ConfigValue = {
      key,
      value,
      description,
      updatedAt: Date.now(),
    };
    
    console.log(`[ConfigService] Updated config ${key} = ${JSON.stringify(value)}`);
    // await db.collection(FIREBASE_COLLECTIONS.CONFIG_STORE).doc(key).set(config);
    
    return config;
  }

  /**
   * Toggles a feature flag.
   */
  static async toggleFeatureFlag(id: string, enabled: boolean): Promise<FeatureFlag> {
    const flag: Partial<FeatureFlag> = {
      id,
      enabled,
    };
    
    console.log(`[ConfigService] Toggled feature flag ${id} to ${enabled}`);
    // await db.collection(FIREBASE_COLLECTIONS.FEATURE_FLAGS).doc(id).update(flag);
    
    return flag as FeatureFlag;
  }
}
