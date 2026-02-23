export type UserRole = 'customer' | 'deliverer' | 'vendor' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  lat: number;
  lng: number;
  balance: number;
  vehicle_details?: string;
  insurance_info?: string;
  is_verified_driver?: boolean;
  team_id?: string;
}

export interface Team {
  id: string;
  name: string;
  type: 'global' | 'local' | 'private';
  members: string[]; // user ids
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'payment' | 'earnings';
  description: string;
  timestamp: string;
}

export interface Invoice {
  id: string;
  task_id: string;
  amount: number;
  status: 'paid' | 'pending';
  created_at: string;
}

export interface DeviceSpecs {
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  battery: string;
  temp: string;
}

export interface NetworkSpecs {
  bluetooth: 'active' | 'inactive';
  wifi: 'active' | 'inactive';
  gsm: 'active' | 'inactive';
  fiveG: 'active' | 'inactive';
  longRange: 'active' | 'inactive';
}

export interface Task {
  id: string;
  creator_id: string;
  driver_id?: string;
  shop_id?: string;
  type: 'delivery' | 'shopping' | 'game' | 'service';
  status: 'open' | 'pending_driver' | 'assigned' | 'in_transit' | 'completed';
  description: string;
  lat: number;
  lng: number;
  price: number;
  weight?: number;
  created_at?: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  image_url: string;
  schedule: string; // JSON string
  lat: number;
  lng: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  price: number;
  image_url: string;
  available: boolean;
  description: string;
  stock: number;
}

export type SocketMessage = 
  | { type: 'task_created'; data: Task }
  | { type: 'task_updated'; data: Task }
  | { type: 'shop_created'; data: Shop }
  | { type: 'user_moved'; data: { userId: string; lat: number; lng: number; role: UserRole } }
  | { type: 'notification'; data: { message: string; type: 'info' | 'alert' } };
