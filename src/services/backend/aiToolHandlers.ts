import { CommerceService } from './commerceService';
import { PaymentService } from './paymentService';
import { YouTubeSignalHandlers } from '../youtube/YouTubeSignalHandlers';
import { OrderStatus, FulfillmentMethod } from '../../types/operational';
import db from '../../../firestore';

import { SignalDistributionEngine } from '../signals/SignalDistributionEngine';
import { UserSignalPreferenceService } from '../signals/UserSignalPreferenceService';
import { SignalLayerPolicyService } from '../signals/SignalLayerPolicyService';
import { AstranovSignal, RenderLayer, SignalCategory } from '../../types/signals';

export const aiToolHandlers = {
  // ... existing handlers ...
  getSignalsForViewport: async (args: { userId: string; layer: RenderLayer; minLat?: number; maxLat?: number; minLng?: number; maxLng?: number; userLat?: number; userLng?: number }) => {
    const bounds = args.minLat !== undefined ? { minLat: args.minLat, maxLat: args.maxLat!, minLng: args.minLng!, maxLng: args.maxLng! } : undefined;
    return await SignalDistributionEngine.getSignals(args.userId, args.layer, bounds, args.userLat, args.userLng);
  },
  updateSignalPreferences: async (args: { userId: string; updates: any }) => {
    await UserSignalPreferenceService.updatePreferences(args.userId, args.updates);
    return { status: 'success' };
  },
  explainSignalReason: async (args: { signalId: string; userId: string }) => {
    // In a real implementation, we'd look up the signal and explain why it was ranked high
    return { 
      reason: "This signal is shown because it matches your interest in global news and is currently trending in your region.",
      signalId: args.signalId
    };
  },
  hideSignalCategory: async (args: { userId: string; category: SignalCategory }) => {
    const prefs = await UserSignalPreferenceService.getPreferences(args.userId);
    if (prefs) {
      const blocked = [...new Set([...prefs.blockedTopics, args.category])];
      const preferred = prefs.preferredCategories.filter(c => c !== args.category);
      await UserSignalPreferenceService.updatePreferences(args.userId, { 
        blockedTopics: blocked,
        preferredCategories: preferred
      });
    }
    return { status: 'success', hiddenCategory: args.category };
  },
  boostSignalCategory: async (args: { userId: string; category: SignalCategory }) => {
    const prefs = await UserSignalPreferenceService.getPreferences(args.userId);
    if (prefs) {
      const preferred = [...new Set([...prefs.preferredCategories, args.category])];
      await UserSignalPreferenceService.updatePreferences(args.userId, { preferredCategories: preferred });
    }
    return { status: 'success', boostedCategory: args.category };
  },
  getMandatorySignals: async (args: { layer: RenderLayer }) => {
    // Mock implementation for AI to see what's mandatory
    return [
      { id: 'm1', title: 'Global Climate Summit 2026', type: 'global_news', priorityScore: 10, metadata: { isMandatory: true } },
      { id: 'm2', title: 'Major Solar Flare Alert', type: 'astronomy', priorityScore: 9.5, metadata: { isMandatory: true } }
    ];
  },
  searchNearby: async (args: { lat: number; lng: number; category?: string; radius?: number }) => {
    return await CommerceService.searchNearby(args.lat, args.lng, args.category);
  },
  searchNearbySignals: async (args: { lat: number; lng: number; radius?: number }) => {
    const radius = args.radius || 5000;
    const snapshot = await db.collection('map_signals').get();
    const signals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Simple distance filter for mock implementation
    return signals.filter((s: any) => {
      const d = Math.sqrt(Math.pow(s.location.lat - args.lat, 2) + Math.pow(s.location.lng - args.lng, 2));
      return d < (radius / 111000); // 1 degree is roughly 111km
    });
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
  getRatings: async (args: { businessId: string }) => {
    const snapshot = await db.collection('ratings').where('businessId', '==', args.businessId).get();
    return snapshot.docs.map(doc => doc.data());
  },
  createCart: async (args: { businessId: string; userId: string }) => {
    const cart = {
      id: `cart_${Date.now()}`,
      userId: args.userId,
      businessId: args.businessId,
      items: [],
      createdAt: Date.now()
    };
    await db.collection('carts').doc(cart.id).set(cart);
    return cart;
  },
  addCartItem: async (args: { cartId: string; productId: string; quantity: number }) => {
    const cartDoc = await db.collection('carts').doc(args.cartId).get();
    if (!cartDoc.exists) return { error: 'Cart not found' };
    const cart = cartDoc.data();
    const productDoc = await db.collection('products').doc(args.productId).get();
    if (!productDoc.exists) return { error: 'Product not found' };
    const product = productDoc.data();
    
    const items = [...(cart?.items || [])];
    items.push({ ...product, quantity: args.quantity });
    await db.collection('carts').doc(args.cartId).update({ items });
    return { status: 'success', cartId: args.cartId };
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
  },
  searchNearbyVideos: async (args: { lat: number; lng: number; radius?: number }) => {
    return await YouTubeSignalHandlers.searchNearbyVideos(args.lat, args.lng, args.radius);
  },
  searchRegionalVideos: async (args: { regionKey: string }) => {
    return await YouTubeSignalHandlers.searchRegionalVideos(args.regionKey);
  },
  getVideoSignalDetails: async (args: { signalId: string }) => {
    return await YouTubeSignalHandlers.getVideoSignalDetails(args.signalId);
  },
  createVideoSignalFromUrl: async (args: { youtubeUrl: string; userId: string; lat?: number; lng?: number }) => {
    const location = args.lat && args.lng ? { lat: args.lat, lng: args.lng } : undefined;
    return await YouTubeSignalHandlers.createVideoSignalFromUrl(args.youtubeUrl, args.userId, location);
  },
  getTrendingVideoSignals: async (args: { scope: 'global' | 'regional' | 'local' }) => {
    return await YouTubeSignalHandlers.getTrendingVideoSignals(args.scope);
  }
};
