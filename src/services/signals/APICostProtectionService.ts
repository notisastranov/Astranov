
import db, { safeFirestore } from '../../../firestore';
import { APIUsageLog, IngestionCooldown } from '../../types/signals';

export class APICostProtectionService {
  private static LOG_COLLECTION = 'api_usage_logs';
  private static COOLDOWN_COLLECTION = 'ingestion_cooldowns';

  static async logUsage(log: APIUsageLog): Promise<void> {
    await safeFirestore(async (firestore) => {
      await firestore.collection(this.LOG_COLLECTION).add(log);
    }, null);
  }

  static async checkCooldown(id: string): Promise<boolean> {
    return safeFirestore(async (firestore) => {
      const doc = await firestore.collection(this.COOLDOWN_COLLECTION).doc(id).get();
      if (!doc.exists) return true;
      
      const data = doc.data() as IngestionCooldown;
      return Date.now() > data.nextAllowed;
    }, true);
  }

  static async setCooldown(id: string, durationMs: number): Promise<void> {
    const now = Date.now();
    await safeFirestore(async (firestore) => {
      await firestore.collection(this.COOLDOWN_COLLECTION).doc(id).set({
        id,
        lastRun: now,
        nextAllowed: now + durationMs
      });
    }, null);
  }

  static async getUsageSummary(): Promise<{ totalCost: number; count: number }> {
    return safeFirestore(async (firestore) => {
      const snapshot = await firestore.collection(this.LOG_COLLECTION).get();
      let totalCost = 0;
      snapshot.docs.forEach((doc: any) => {
        totalCost += doc.data().cost || 0;
      });
      return { totalCost, count: snapshot.size };
    }, { totalCost: 0, count: 0 });
  }
}
