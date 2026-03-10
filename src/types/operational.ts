import { Type } from "@google/genai";

export enum OrderStatus {
  DRAFT = 'draft',
  AWAITING_PAYMENT = 'awaiting_payment',
  PAID = 'paid',
  ACCEPTED = 'accepted',
  PREPARING = 'preparing',
  DRIVER_ASSIGNED = 'driver_assigned',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum DeliveryStatus {
  OPEN = 'open',
  OFFERED = 'offered',
  ACCEPTED = 'accepted',
  PICKED_UP = 'picked_up',
  ON_ROUTE = 'on_route',
  DELIVERED = 'delivered',
  FAILED = 'failed'
}

export enum FulfillmentMethod {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
  MOTORCYCLE = 'motorcycle',
  CAR = 'car',
  DRONE = 'drone'
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  image: string;
  photos: string[];
  contact: {
    phone?: string;
    email?: string;
  };
  hours: string; // JSON or string description
  categories: string[];
  deliveryEnabled: boolean;
  rating: number;
  reviewCount: number;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  title: string;
  description: string;
  image: string;
  photo: string;
  price: number;
  quantityAvailable: number;
  volumeLiters?: number;
  weightKg?: number;
  sizeLabel?: string;
  category: string;
  isAvailable: boolean;
}

export interface Order {
  id: string;
  userId: string;
  businessId: string;
  items: OrderItem[];
  status: OrderStatus;
  fulfillment: {
    method: FulfillmentMethod;
    address?: string;
    location?: { lat: number; lng: number };
    estimatedArrival?: string;
  };
  pricing: OrderPricing;
  createdAt: number;
  updatedAt: number;
  paidAt?: number;
  preparedAt?: number;
  deliveredAt?: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  quantity: number;
  price: number;
  volumeLiters?: number;
  weightKg?: number;
}

export interface OrderPricing {
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  tax: number;
  total: number;
  pricingBreakdown: DeliveryPricingResult;
}

export interface DeliveryTask {
  id: string;
  orderId: string;
  driverId?: string;
  status: DeliveryStatus;
  pickupLocation: { lat: number; lng: number; address: string };
  dropoffLocation: { lat: number; lng: number; address: string };
  pricing: DeliveryPricingResult;
  createdAt: number;
  updatedAt: number;
  pickedUpAt?: number;
  deliveredAt?: number;
}

export interface DeliveryPricingResult {
  basePrice: number;
  surchargeDistance: number;
  surchargeTime: number;
  surchargeVolume: number;
  surchargeWeight: number;
  surchargeWeather: number;
  returnDistanceCharge: number;
  totalDeliveryPrice: number;
  shopContribution: number;
  customerContribution: number;
}

export interface DriverProfile {
  userId: string;
  isVerified: boolean;
  vehicleType: string;
  licensePlate?: string;
  currentLocation?: { lat: number; lng: number };
  isOnline: boolean;
  rating: number;
}

export interface Transaction {
  id: string;
  orderId?: string;
  amount: number;
  currency: string;
  payerId: string;
  receiverId: string;
  type: 'payment' | 'payout' | 'fee' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  provider: 'paypal' | 'revolut' | 'internal';
  createdAt: number;
}

export interface LedgerEntry {
  id: string;
  orderId: string;
  transactionId?: string;
  accountId?: string;
  type: 'payment' | 'payout' | 'fee' | 'refund' | 'adjustment';
  amount: number;
  currency: string;
  fromId: string;
  toId: string;
  description: string;
  timestamp: number;
}

export interface MapSignal {
  id: string;
  lat: number;
  lng: number;
  type: 'news' | 'work' | 'social' | 'economy' | 'friend' | 'shop' | 'real_estate' | 'classifieds' | 'youtube' | 'event';
  label: string;
  description: string;
  color: string;
  businessId?: string;
  mediaPreview?: string;
  youtubeId?: string;
  createdAt: number;
  authorId: string;
}

export interface OrbitalSignal extends MapSignal {
  altitude?: number; // For floating effect
}

export interface VideoSignal {
  id: string;
  videoId: string;
  youtubeUrl: string;
  title: string;
  thumbnail: string;
  lat: number;
  lng: number;
  authorId: string;
  createdAt: number;
}

export interface UserUILayout {
  userId: string;
  layoutConfig: {
    buttons: {
      id: string;
      position: { x: number; y: number };
      region: 'left' | 'right' | 'top' | 'bottom-center' | 'bottom-right';
    }[];
  };
  lastUpdated: number;
}



export enum OperatorActionType {
  CONFIG_UPDATE = 'config_update',
  CODE_PATCH = 'code_patch',
  DEPLOYMENT = 'deployment',
  FEATURE_FLAG = 'feature_flag',
  REPO_SYNC = 'repo_sync'
}

export interface OperatorCommand {
  id: string;
  operatorId: string;
  rawCommand: string;
  interpretedAction: OperatorActionType;
  parameters: any;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  timestamp: number;
}

export interface ChangeRequest {
  id: string;
  operatorId: string;
  description: string;
  patch?: string;
  status: 'draft' | 'review' | 'approved' | 'applied' | 'rejected';
  createdAt: number;
}

export interface DeploymentRequest {
  id: string;
  operatorId: string;
  environment: 'staging' | 'production';
  version: string;
  status: 'queued' | 'in_progress' | 'success' | 'failed';
  createdAt: number;
}

export interface RepoSyncRequest {
  id: string;
  actorId: string;
  actorRole: string;
  createdAt: number;
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';
  branch: string;
  commitMessage: string;
  files: string[];
  result?: string;
  errorMessage?: string;
}

export interface PatchArtifact {
  id: string;
  createdAt: number;
  actorId: string;
  description: string;
  targetFiles: string[];
  patchContent: string;
  status: 'draft' | 'applied' | 'rejected';
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetId?: string;
  status: 'success' | 'failure';
  details: any;
  timestamp: number;
}
