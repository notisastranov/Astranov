import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Utensils, Coffee, ShoppingBag, Home, 
  Megaphone, Briefcase, Heart, Newspaper, 
  Store, Users, Truck, Globe, Settings,
  CreditCard, FileText, BarChart3, Shield, Gamepad2, Zap
} from 'lucide-react';
import StatusRibbon from './StatusRibbon';
import { UserRole } from '../types';

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory?: (name: string) => void;
  onSpawnWidget?: (category: any) => void;
  balance: number;
  userName: string;
  userId: string;
  networkStatus: 'ok' | 'warn' | 'bad';
  deviceInfo: string;
  onToggleStatus: (active: boolean) => void;
  isActive: boolean;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isVerifiedDriver: boolean;
  hasShop: boolean;
}

const CATEGORIES = [
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
  { name: 'Simulation', icon: Zap, color: 'text-electric-blue' },
  { name: 'Settings', icon: Settings, color: 'text-zinc-500' },
];

export default function CategoryDrawer({ 
  isOpen, onClose, onSelectCategory, onSpawnWidget,
  balance, userName, userId, networkStatus, deviceInfo,
  onToggleStatus, isActive, currentRole, onRoleChange,
  isVerifiedDriver, hasShop
}: CategoryDrawerProps) {
  const [longPressTimer, setLongPressTimer] = React.useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = (cat: any) => {
    const timer = setTimeout(() => {
      onSpawnWidget?.(cat);
      onClose();
    }, 600);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          className="w-full rounded-[32px] bg-zinc-900/95 border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-2xl flex flex-col max-h-[80vh]"
        >
          <div className="p-4 sm:p-6 flex justify-between items-center border-b border-white/5 shrink-0">
            <div>
              <h3 className="text-white font-black text-lg uppercase tracking-[0.2em] italic">Astranov</h3>
              <p className="text-white/40 text-[10px] uppercase tracking-widest">Select a service or long-press to pin</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="w-10 h-10 shrink-0 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1">
            <div className="p-4 sm:p-6 border-b border-white/5">
              <StatusRibbon 
                balance={balance}
                userName={userName}
                userId={userId}
                networkStatus={networkStatus}
                deviceInfo={deviceInfo}
                onToggleStatus={onToggleStatus}
                isActive={isActive}
                currentRole={currentRole}
                onRoleChange={onRoleChange}
                isVerifiedDriver={isVerifiedDriver}
                hasShop={hasShop}
              />
            </div>

            <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => onSelectCategory?.(cat.name)}
                onMouseDown={() => handleTouchStart(cat)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onTouchStart={() => handleTouchStart(cat)}
                onTouchEnd={handleTouchEnd}
                className="group relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border border-white/5 bg-white/5 hover:border-electric-blue/30 hover:bg-electric-blue/5 transition-all active:scale-[0.98]"
              >
                <cat.icon className={`w-6 h-6 ${cat.color} group-hover:scale-110 transition-transform`} />
                <span className="text-white text-[10px] uppercase tracking-widest font-black">{cat.name}</span>
                <div className="absolute inset-0 rounded-2xl bg-electric-blue/0 group-hover:bg-electric-blue/5 transition-colors" />
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6 flex gap-3 sm:gap-4 border-t border-white/5 bg-black/20 shrink-0">
              <button className="flex-1 h-12 rounded-xl border border-white/10 bg-white/5 text-white text-[10px] uppercase tracking-widest font-black hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" /> Billing
              </button>
              <button className="flex-1 h-12 rounded-xl border border-white/10 bg-white/5 text-white text-[10px] uppercase tracking-widest font-black hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" /> Security
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
