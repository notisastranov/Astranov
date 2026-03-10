import { 
  Utensils, Coffee, ShoppingBag, Home, 
  Megaphone, Briefcase, Heart, Newspaper, 
  Store, Users, Truck, Globe, Settings,
  CreditCard, FileText, BarChart3, Shield, Gamepad2, Zap, Radar
} from 'lucide-react';

export const CATEGORIES = [
  { name: 'Food', icon: Utensils, color: 'text-orange-400' },
  { name: 'Drinks', icon: Coffee, color: 'text-yellow-400' },
  { name: 'Supermarket', icon: ShoppingBag, color: 'text-green-400' },
  { name: 'Real Estate', icon: Home, color: 'text-blue-400' },
  { name: 'Ads', icon: Megaphone, color: 'text-purple-400' },
  { name: 'Work', icon: Briefcase, color: 'text-zinc-400' },
  { name: 'Dating', icon: Heart, color: 'text-pink-400' },
  { name: 'News', icon: Newspaper, color: 'text-red-400' },
  { name: 'Shops', icon: Store, color: 'text-indigo-400' },
  { name: 'Team', icon: Users, color: 'text-cyan-400' },
  { name: 'Drivers', icon: Truck, color: 'text-electric-blue' },
  { name: 'Global', icon: Globe, color: 'text-white' },
  { name: 'Invoices', icon: FileText, color: 'text-emerald-400' },
  { name: 'Analytics', icon: BarChart3, color: 'text-violet-400' },
  { name: 'Games', icon: Gamepad2, color: 'text-pink-500' },
  { name: 'Radar', icon: Radar, color: 'text-green-400' },
  { name: 'Balance', icon: CreditCard, color: 'text-ok' },
  { name: 'Settings', icon: Settings, color: 'text-zinc-500' },
];

export const DEFAULT_HUD_LAYOUT: any[] = [
  // LEFT COLUMN: System and diagnostics
  { id: 'settings', label: 'Settings', icon: 'Settings', region: 'left', order: 0, enabled: true, status: 'healthy' },
  { id: 'health', label: 'Health', icon: 'Activity', region: 'left', order: 1, enabled: true, status: 'healthy', data: '98%' },
  { id: 'console', label: 'Console', icon: 'Terminal', region: 'left', order: 2, enabled: true, status: 'healthy' },
  { id: 'diagnostics', label: 'Diagnostics', icon: 'Cpu', region: 'left', order: 3, enabled: true, status: 'healthy' },
  { id: 'dev_tools', label: 'Dev Tools', icon: 'Code', region: 'left', order: 4, enabled: true, status: 'healthy' },

  // RIGHT COLUMN: Map controls
  { id: 'radar_btn', label: 'Radar', icon: 'Radar', region: 'right', order: 0, enabled: true, status: 'healthy' },
  { id: 'filters', label: 'Filters', icon: 'Filter', region: 'right', order: 1, enabled: true, status: 'healthy' },
  { id: 'layers', label: 'Layers', icon: 'Layers', region: 'right', order: 2, enabled: true, status: 'healthy' },
  { id: 'gps', label: 'GPS', icon: 'MapPin', region: 'right', order: 3, enabled: true, status: 'healthy' },
  { id: 'signals', label: 'Signals', icon: 'Radio', region: 'right', order: 4, enabled: true, status: 'healthy' },
  { id: 'scanning', label: 'Scanning', icon: 'Zap', region: 'right', order: 5, enabled: true, status: 'healthy' },

  // TOP CENTER: User and economy
  { id: 'wallet', label: 'Wallet', icon: 'Wallet', region: 'top', order: 0, enabled: true, status: 'finance', data: '€1,240.50' },
  { id: 'profile', label: 'Profile', icon: 'User', region: 'top', order: 1, enabled: true, status: 'healthy' },
  { id: 'posting', label: 'Posting', icon: 'PlusSquare', region: 'top', order: 2, enabled: true, status: 'healthy' },
  { id: 'notifications', label: 'Notifications', icon: 'Bell', region: 'top', order: 3, enabled: true, status: 'healthy' },
  { id: 'economics', label: 'Economics', icon: 'Euro', region: 'top', order: 4, enabled: true, status: 'healthy' },

  // BOTTOM CENTER: Action shortcuts
  { id: 'create_task', label: 'Create Task', icon: 'Plus', region: 'bottom-center', order: 0, enabled: true, status: 'healthy' },
  { id: 'video_post', label: 'Post Video', icon: 'Video', region: 'bottom-center', order: 1, enabled: true, status: 'healthy' },
  { id: 'social_post', label: 'Post Update', icon: 'MessageSquare', region: 'bottom-center', order: 2, enabled: true, status: 'healthy' },
];
