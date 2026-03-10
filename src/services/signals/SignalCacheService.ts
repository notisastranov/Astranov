
import db, { safeFirestore } from '../../../firestore';
import { SignalCacheItem } from '../../types/signals';

export class SignalCacheService {
  private static COLLECTION = 'signal_cache';

  static async get(sourceType: string, sourceId: string): Promise<SignalCacheItem | null> {
    const id = `${sourceType}_${sourceId}`;
    return safeFirestore(async (firestore) => {
      const doc = await firestore.collection(this.COLLECTION).doc(id).get();
      if (!doc.exists) return null;
      
      const data = doc.data() as SignalCacheItem;
      if (Date.now() > data.expiresAt) return null;
      
      return data;
    }, null);
  }

  static async set(item: SignalCacheItem): Promise<void> {
    const id = `${item.sourceType}_${item.sourceId}`;
    await safeFirestore(async (firestore) => {
      await firestore.collection(this.COLLECTION).doc(id).set(item);
    }, null);
  }
}
