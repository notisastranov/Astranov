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
  // LEFT COLUMN
  { id: 'profile', label: 'Profile', icon: 'User', region: 'left', order: 0, enabled: true, status: 'healthy' },
  { id: 'saved', label: 'Saved', icon: 'Bookmark', region: 'left', order: 1, enabled: true, status: 'healthy' },
  { id: 'diagnostics', label: 'Diagnostics', icon: 'Activity', region: 'left', order: 2, enabled: true, status: 'warning' },
  { id: 'history', label: 'History', icon: 'History', region: 'left', order: 3, enabled: true, status: 'healthy' },

  // RIGHT COLUMN
  { id: 'zoom_in', label: 'Zoom In', icon: 'Plus', region: 'right', order: 0, enabled: true, status: 'healthy' },
  { id: 'zoom_out', label: 'Zoom Out', icon: 'Minus', region: 'right', order: 1, enabled: true, status: 'healthy' },
  { id: 'layers', label: 'Layers', icon: 'Layers', region: 'right', order: 2, enabled: true, status: 'healthy' },
  { id: 'filters', label: 'Filters', icon: 'Filter', region: 'right', order: 3, enabled: true, status: 'healthy' },
  { id: 'recenter', label: 'Recenter', icon: 'Crosshair', region: 'right', order: 4, enabled: true, status: 'healthy' },
  { id: 'globe_map', label: 'Globe/Map', icon: 'Globe', region: 'right', order: 5, enabled: true, status: 'healthy' },

  // TOP CENTER
  { id: 'wallet', label: 'Wallet', icon: 'Wallet', region: 'top', order: 0, enabled: true, status: 'finance', data: '€1,240.50' },
  { id: 'login', label: 'Login', icon: 'LogIn', region: 'top', order: 1, enabled: true, status: 'healthy' },
  { id: 'post', label: 'Post', icon: 'PlusSquare', region: 'top', order: 2, enabled: true, status: 'healthy' },
  { id: 'broadcast', label: 'Broadcast', icon: 'Radio', region: 'top', order: 3, enabled: true, status: 'healthy' },
];
