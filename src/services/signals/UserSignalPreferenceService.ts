
import db, { safeFirestore } from '../../../firestore';
import { UserSignalPreferences, SignalCategory } from '../../types/signals';

export class UserSignalPreferenceService {
  private static COLLECTION = 'signal_preferences';

  static async getPreferences(userId: string): Promise<UserSignalPreferences | null> {
    return safeFirestore(async (firestore) => {
      const doc = await firestore.collection(this.COLLECTION).doc(userId).get();
      if (!doc.exists) return this.getDefaultPreferences(userId);
      return doc.data() as UserSignalPreferences;
    }, this.getDefaultPreferences(userId));
  }

  static async updatePreferences(userId: string, updates: Partial<UserSignalPreferences>): Promise<void> {
    await safeFirestore(async (firestore) => {
      await firestore.collection(this.COLLECTION).doc(userId).set({
        ...updates,
        userId,
        updatedAt: Date.now()
      }, { merge: true });
    }, null);
  }

  static getDefaultPreferences(userId: string): UserSignalPreferences {
    return {
      userId,
      followedTopics: [],
      blockedTopics: [],
      preferredCategories: ['global_news', 'alerts', 'youtube_video', 'weather'],
      preferredLanguages: ['en'],
      followedCreators: [],
      followedRegions: [],
      sensitivityToAlerts: 0.8,
      contentDensityPreference: 0.5,
      updatedAt: Date.now()
    };
  }
}
