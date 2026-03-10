import firestore, { safeFirestore } from '../../../firestore';
import { Order, OrderStatus, FulfillmentMethod, OrderItem } from '../../types/operational';
import { LedgerService } from './ledgerService';

export class CommerceService {
  private static get orders() { return firestore.collection('orders'); }
  private static get businesses() { return firestore.collection('businesses'); }
  private static get products() { return firestore.collection('products'); }

  static async createOrder(userId: string, businessId: string, items: OrderItem[], fulfillment: { method: FulfillmentMethod; address?: string }) {
    return safeFirestore(async (db) => {
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const deliveryFee = fulfillment.method === FulfillmentMethod.PICKUP ? 0 : 5.00;
      const platformFee = subtotal * 0.05;
      const tax = subtotal * 0.10;
      const total = subtotal + deliveryFee + platformFee + tax;

      const order: Order = {
        id: db.collection('orders').doc().id,
        userId,
        businessId,
        items,
        status: OrderStatus.DRAFT,
        fulfillment: {
          ...fulfillment,
          estimatedArrival: new Date(Date.now() + 45 * 60000).toISOString() // 45 mins from now
        },
        pricing: { 
          subtotal, 
          deliveryFee, 
          platformFee, 
          tax, 
          total,
          pricingBreakdown: {
            basePrice: deliveryFee,
            surchargeDistance: 0,
            surchargeTime: 0,
            surchargeVolume: 0,
            surchargeWeight: 0,
            surchargeWeather: 0,
            returnDistanceCharge: 0,
            totalDeliveryPrice: deliveryFee,
            shopContribution: 0,
            customerContribution: deliveryFee
          }
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await db.collection('orders').doc(order.id).set(order);
      
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
    }, null as any);
  }

  static async updateOrderStatus(orderId: string, status: OrderStatus) {
    await safeFirestore(async (db) => {
      await db.collection('orders').doc(orderId).update({ status, updatedAt: Date.now() });
      console.log(`[Commerce] Order ${orderId} status updated to ${status}`);
    }, null);
  }

  static async getBusiness(businessId: string) {
    return safeFirestore(async (db) => {
      const doc = await db.collection('businesses').doc(businessId).get();
      return doc.data();
    }, null);
  }

  static async getMenu(businessId: string) {
    return safeFirestore(async (db) => {
      const snapshot = await db.collection('products').where('businessId', '==', businessId).get();
      return snapshot.docs.map(doc => doc.data());
    }, []);
  }

  static async searchNearby(lat: number, lng: number, category?: string, sortByRating: boolean = false) {
    return safeFirestore(async (db) => {
      // Mocking spatial search
      let query: any = db.collection('businesses');
      if (category) query = query.where('category', '==', category);
      
      const snapshot = await query.get();
      let results = snapshot.docs.map((doc: any) => doc.data());
      
      if (sortByRating) {
        results = results.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
      }
      
      return results;
    }, []);
  }
}
