import { Firestore } from '@google-cloud/firestore';
import { Order, OrderStatus, FulfillmentMethod, OrderItem } from '../../types/operational';
import { LedgerService } from './ledgerService';

const firestore = new Firestore();

export class CommerceService {
  private static orders = firestore.collection('orders');
  private static businesses = firestore.collection('businesses');
  private static products = firestore.collection('products');

  static async createOrder(userId: string, businessId: string, items: OrderItem[], fulfillment: { method: FulfillmentMethod; address?: string }) {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = fulfillment.method === FulfillmentMethod.PICKUP ? 0 : 5.00;
    const platformFee = subtotal * 0.05;
    const tax = subtotal * 0.10;
    const total = subtotal + deliveryFee + platformFee + tax;

    const order: Order = {
      id: this.orders.doc().id,
      userId,
      businessId,
      items,
      status: OrderStatus.DRAFT,
      fulfillment: {
        ...fulfillment,
        estimatedArrival: new Date(Date.now() + 45 * 60000).toISOString() // 45 mins from now
      },
      pricing: { subtotal, deliveryFee, platformFee, tax, total },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await this.orders.doc(order.id).set(order);
    
    // Record in ledger as draft order
    await LedgerService.recordEntry({
      orderId: order.id,
      type: 'adjustment',
      amount: total,
      currency: 'USD',
      fromId: userId,
      toId: businessId,
      description: `Draft order ${order.id} created`
    });

    return order;
  }

  static async updateOrderStatus(orderId: string, status: OrderStatus) {
    await this.orders.doc(orderId).update({ status, updatedAt: Date.now() });
    console.log(`[Commerce] Order ${orderId} status updated to ${status}`);
  }

  static async getBusiness(businessId: string) {
    const doc = await this.businesses.doc(businessId).get();
    return doc.data();
  }

  static async getMenu(businessId: string) {
    const snapshot = await this.products.where('businessId', '==', businessId).get();
    return snapshot.docs.map(doc => doc.data());
  }

  static async searchNearby(lat: number, lng: number, category?: string, sortByRating: boolean = false) {
    // Mocking spatial search
    let query: any = this.businesses;
    if (category) query = query.where('category', '==', category);
    
    const snapshot = await query.get();
    let results = snapshot.docs.map((doc: any) => doc.data());
    
    if (sortByRating) {
      results = results.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    }
    
    return results;
  }
}
