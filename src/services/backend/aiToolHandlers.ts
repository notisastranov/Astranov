import { CommerceService } from './commerceService';
import { PaymentService } from './paymentService';
import { OrderStatus, FulfillmentMethod } from '../../types/operational';
import db from '../../../firestore.js';

export const aiToolHandlers = {
  searchNearby: async (args: { lat: number; lng: number; category?: string; radius?: number }) => {
    return await CommerceService.searchNearby(args.lat, args.lng, args.category);
  },
  searchWeb: async (args: { query: string }) => {
    // In a real app, we'd use a search API. 
    // Here we return a message indicating that Gemini's native search grounding should be used.
    return { 
      status: 'success', 
      message: "Web search context requested. Please use native Google Search grounding for the most accurate results.",
      query: args.query
    };
  },
  getBestRated: async (args: { lat: number; lng: number; category: string }) => {
    return await CommerceService.searchNearby(args.lat, args.lng, args.category, true);
  },
  getBusinessDetails: async (args: { businessId: string }) => {
    return await CommerceService.getBusiness(args.businessId);
  },
  getMenu: async (args: { businessId: string }) => {
    return await CommerceService.getMenu(args.businessId);
  },
  createOrder: async (args: { userId: string; businessId: string; items: any[]; fulfillment: { method: FulfillmentMethod; address?: string } }) => {
    return await CommerceService.createOrder(args.userId, args.businessId, args.items, args.fulfillment);
  },
  chooseDeliveryMethod: async (args: { orderId: string; method: FulfillmentMethod }) => {
    await CommerceService.updateOrderStatus(args.orderId, OrderStatus.DRAFT); // Just update metadata
    return { status: 'success', method: args.method };
  },
  createPaymentIntent: async (args: { orderId: string; provider: 'paypal' | 'revolut'; amount: number; currency: string; userId: string }) => {
    return await PaymentService.createPayment(args.provider, args.amount, args.currency, args.orderId, args.userId);
  },
  getOrderStatus: async (args: { orderId: string }) => {
    const orderDoc = await db.collection('orders').doc(args.orderId).get();
    if (!orderDoc.exists) return { error: 'Order not found' };
    return orderDoc.data();
  },
  createPostAtLocation: async (args: { lat: number; lng: number; content: string; userId: string; contentType?: string }) => {
    const post = {
      id: `post_${Date.now()}`,
      userId: args.userId,
      content: args.content,
      type: args.contentType || 'social',
      location: { lat: args.lat, lng: args.lng },
      timestamp: Date.now()
    };
    await db.collection('map_signals').doc(post.id).set(post);
    return { status: 'success', postId: post.id };
  },
  saveUserPreference: async (args: { userId: string; key: string; value: string }) => {
    await db.collection('user_preferences').doc(args.userId).set({ [args.key]: args.value }, { merge: true });
    return { status: 'success', key: args.key, value: args.value };
  },
  saveLocation: async (args: { lat: number; lng: number; label: string; userId: string }) => {
    const loc = {
      id: `loc_${Date.now()}`,
      userId: args.userId,
      label: args.label,
      location: { lat: args.lat, lng: args.lng },
      timestamp: Date.now()
    };
    await db.collection('saved_locations').doc(loc.id).set(loc);
    return { status: 'success', locationId: loc.id };
  }
};
