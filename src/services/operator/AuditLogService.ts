import { AuditLog } from '../../types';
import { FIREBASE_COLLECTIONS } from '../firebase/schema';

export class AuditLogService {
  /**
   * Logs an action to the audit log.
   */
  static async logAction(
    actor: string,
    action: string,
    details: any
  ): Promise<AuditLog> {
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      actor,
      action,
      details,
    };
    
    console.log(`[AuditLogService] ${actor} performed ${action}`);
    // await db.collection(FIREBASE_COLLECTIONS.AUDIT_LOGS).add(log);
    
    return log;
  }
}
