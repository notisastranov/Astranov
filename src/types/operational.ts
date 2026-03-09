import { Type } from "@google/genai";

export enum OrderStatus {
  DRAFT = 'draft',
  AWAITING_PAYMENT = 'awaiting_payment',
  PAID = 'paid',
  ACCEPTED = 'accepted',
  PREPARING = 'preparing',
  ASSIGNED = 'assigned',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum ServiceStatus {
  INQUIRY = 'inquiry',
  QUOTED = 'quoted',
  ACCEPTED = 'accepted',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  CLOSED = 'closed'
}

export enum FulfillmentMethod {
  PICKUP = 'pickup',
  MOTORCYCLE = 'motorcycle',
  CAR = 'car',
  DRONE = 'drone',
  IN_PERSON = 'in_person',
  DIGITAL = 'digital'
}

export interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  image: string;
  contact: {
    phone?: string;
    email?: string;
  };
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
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
    estimatedArrival?: string;
  };
  pricing: {
    subtotal: number;
    deliveryFee: number;
    platformFee: number;
    tax: number;
    total: number;
  };
  paymentIntentId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface LedgerEntry {
  id: string;
  orderId: string;
  type: 'payment' | 'payout' | 'fee' | 'refund' | 'adjustment';
  amount: number;
  currency: string;
  fromId: string;
  toId: string;
  description: string;
  timestamp: number;
  metadata?: any;
}

export interface MapSignal {
  id: string;
  lat: number;
  lng: number;
  type: 'news' | 'work' | 'social' | 'economy' | 'friend' | 'shop' | 'real_estate' | 'classifieds';
  label: string;
  description: string;
  color: string;
  businessId?: string;
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
