export type UserRole = 'user' | 'deliverer' | 'vendor' | 'admin' | 'supervisor' | 'owner' | 'operator';

export type HudRegion = 'top' | 'left' | 'right' | 'bottom';

export interface HudButtonConfig {
  id: string;
  label: string;
  icon: string; // Lucide icon name
  region: HudRegion;
  order: number;
  enabled: boolean;
  status?: 'healthy' | 'warning' | 'problem' | 'finance';
  data?: string; // Embedded info
}

export interface UiPreferences {
  userId: string;
  buttons: HudButtonConfig[];
  theme: 'dark' | 'light' | 'space';
}

export type OperatorCommandType = 'live_config_update' | 'ui_layout_update' | 'code_patch_request' | 'deployment_request';

export interface OperatorCommand {
  id: string;
  timestamp: number;
  actor: string;
  role: UserRole;
  command: string;
  type: OperatorCommandType;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  result?: string;
  targetArea?: string;
}

export interface ChangeRequest {
  id: string;
  type: 'feature' | 'fix' | 'config' | 'layout';
  description: string;
  status: 'draft' | 'submitted' | 'review' | 'approved' | 'merged' | 'rejected';
  creatorId: string;
  createdAt: number;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  environment: 'dev' | 'staging' | 'prod';
}

export interface ConfigValue {
  key: string;
  value: any;
  description: string;
  updatedAt: number;
}

export interface DeploymentRequest {
  id: string;
  environment: 'staging' | 'production';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  version: string;
  requestedBy: string;
  timestamp: number;
}

export interface PatchRequest {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'applied' | 'rejected';
  codeChanges?: string; // Diff or patch content
  createdAt: number;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  actor: string;
  action: string;
  details: any;
}

export interface RepoSyncRequest {
  id: string;
  repo: string;
  branch: string;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  requestedBy: string;
  timestamp: number;
}

export interface PatchArtifact {
  id: string;
  name: string;
  content: string;
  type: 'frontend' | 'backend' | 'config';
  createdAt: number;
}

export interface ReleaseRequest {
  id: string;
  version: string;
  notes: string;
  status: 'draft' | 'released';
  createdAt: number;
}

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
  accepted_terms_at?: string;
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

export interface Publication {
  id: string;
  user_id: string;
  user_name: string;
  type: 'video' | 'image' | 'text';
  content_url?: string;
  thumbnail_url?: string;
  description: string;
  lat: number;
  lng: number;
  timestamp: string;
  likes: number;
  views: number;
}

export type SocketMessage = 
  | { type: 'task_created'; data: Task }
  | { type: 'task_updated'; data: Task }
  | { type: 'shop_created'; data: Shop }
  | { type: 'user_moved'; data: { userId: string; lat: number; lng: number; role: UserRole } }
  | { type: 'notification'; data: { message: string; type: 'info' | 'alert' } };
