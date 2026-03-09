import { Firestore } from '@google-cloud/firestore';
import { LedgerEntry } from '../../types/operational';

const firestore = new Firestore();

export class LedgerService {
  private static collection = firestore.collection('ledger');

  static async recordEntry(entry: Omit<LedgerEntry, 'id' | 'timestamp'>) {
    const docRef = this.collection.doc();
    const newEntry: LedgerEntry = {
      ...entry,
      id: docRef.id,
      timestamp: Date.now()
    };
    await docRef.set(newEntry);
    console.log(`[Ledger] Recorded ${entry.type}: ${entry.amount} from ${entry.fromId} to ${entry.toId}`);
    return newEntry;
  }

  static async getOrderLedger(orderId: string) {
    const snapshot = await this.collection.where('orderId', '==', orderId).get();
    return snapshot.docs.map(doc => doc.data() as LedgerEntry);
  }

  static async generateReport(filters: { from?: number; to?: number; type?: string }) {
    let query: any = this.collection;
    if (filters.from) query = query.where('timestamp', '>=', filters.from);
    if (filters.to) query = query.where('timestamp', '<=', filters.to);
    if (filters.type) query = query.where('type', '==', filters.type);
    
    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => doc.data() as LedgerEntry);
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
