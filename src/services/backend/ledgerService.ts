import firestore, { safeFirestore } from '../../../firestore';
import { LedgerEntry } from '../../types/operational';

export class LedgerService {
  static async recordEntry(entry: Omit<LedgerEntry, 'id' | 'timestamp'>) {
    return safeFirestore(async (db) => {
      const docRef = db.collection('ledger').doc();
      const newEntry: LedgerEntry = {
        ...entry,
        id: docRef.id,
        timestamp: Date.now()
      };
      await docRef.set(newEntry);
      console.log(`[Ledger] Recorded ${entry.type}: ${entry.amount} from ${entry.fromId} to ${entry.toId}`);
      return newEntry;
    }, null as any);
  }

  static async getOrderLedger(orderId: string) {
    return safeFirestore(async (db) => {
      const snapshot = await db.collection('ledger').where('orderId', '==', orderId).get();
      return snapshot.docs.map(doc => doc.data() as LedgerEntry);
    }, []);
  }

  static async generateReport(filters: { from?: number; to?: number; type?: string }) {
    return safeFirestore(async (db) => {
      let query: any = db.collection('ledger');
      if (filters.from) query = query.where('timestamp', '>=', filters.from);
      if (filters.to) query = query.where('timestamp', '<=', filters.to);
      if (filters.type) query = query.where('type', '==', filters.type);
      
      const snapshot = await query.get();
      return snapshot.docs.map((doc: any) => doc.data() as LedgerEntry);
    }, []);
  }

  static async generateInvoice(orderId: string) {
    const entries = await this.getOrderLedger(orderId);
    const subtotal = entries.filter(e => e.type === 'payout').reduce((sum, e) => sum + e.amount, 0);
    const fees = entries.filter(e => e.type === 'fee').reduce((sum, e) => sum + e.amount, 0);
    
    return {
      invoiceId: `INV-${orderId}-${Date.now()}`,
      orderId,
      date: new Date().toISOString(),
      items: [
        { description: 'Subtotal', amount: subtotal },
        { description: 'Platform Fees & Taxes', amount: fees }
      ],
      total: subtotal + fees
    };
  }
}
