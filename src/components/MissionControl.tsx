import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Truck, Store, Users, History, Package, MapPin, Navigation, Star, Clock, Euro, ShieldCheck, ExternalLink } from 'lucide-react';
import { Task, User, Shop } from '../types';

interface MissionControlProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  shops: Shop[];
  groundingShops: Shop[];
  users: User[];
  currentUserId: string | null;
  onSelectShop: (shop: Shop) => void;
  onSelectTask: (task: Task) => void;
  onSelectUser: (user: User) => void;
}

export default function MissionControl({
  isOpen,
  onClose,
  tasks,
  shops,
  groundingShops,
  users,
  currentUserId,
  onSelectShop,
  onSelectTask,
  onSelectUser
}: MissionControlProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'shops' | 'operatives' | 'history'>('orders');

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const drivers = users.filter(u => u.role === 'deliverer');
  const clients = users.filter(u => u.role === 'user');
  const allShops = Array.from(new Map([...shops, ...groundingShops].map(s => [s.id, s])).values());

  const tabs = [
    { id: 'orders', label: 'Active Orders', icon: Package, count: activeTasks.length, color: 'text-yellow-500' },
    { id: 'shops', label: 'Nearby Shops', icon: Store, count: allShops.length, color: 'text-purple-400' },
    { id: 'operatives', label: 'Operatives', icon: Users, count: users.length, color: 'text-blue-400' },
    { id: 'history', label: 'History', icon: History, count: completedTasks.length, color: 'text-emerald-500' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl h-[80vh] bg-zinc-900/95 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-electric-blue/20 flex items-center justify-center text-electric-blue">
                  <Navigation className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Mission Control</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">Real-time System Oversight</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-8 pt-6 gap-2 overflow-x-auto no-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-electric-blue text-black font-black' 
                      : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-widest">{tab.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-black/20' : 'bg-white/10'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
              {activeTab === 'orders' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTasks.length > 0 ? activeTasks.map(task => (
                    <motion.div 
                      key={task.id}
                      layoutId={task.id}
                      onClick={() => onSelectTask(task)}
                      className="p-5 bg-white/5 border border-white/10 rounded-3xl hover:border-electric-blue/40 transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                            task.status === 'pending_driver' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          <h4 className="text-lg font-black text-white mt-2 group-hover:text-electric-blue transition-colors">{task.description}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-emerald-500">€{task.price?.toFixed(2)}</p>
                          <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest">Est. Value</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-white/40">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">Active</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3 h-3" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">
                            {task.driver_id ? 'Driver Assigned' : 'Awaiting Driver'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-white/20">
                      <Package className="w-16 h-16 mb-4 opacity-10" />
                      <p className="text-sm font-black uppercase tracking-widest">No Active Missions</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'shops' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allShops.length > 0 ? allShops.map(shop => (
                    <motion.div 
                      key={shop.id}
                      onClick={() => onSelectShop(shop)}
                      className="p-5 bg-white/5 border border-white/10 rounded-3xl hover:border-purple-500/40 transition-all cursor-pointer group flex gap-4"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center text-3xl overflow-hidden shrink-0">
                        {shop.image_url ? (
                          <img src={shop.image_url} alt={shop.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : '🏪'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-black text-white group-hover:text-purple-400 transition-colors truncate">{shop.name}</h4>
                          {shop.id.startsWith('gshop-') && <ShieldCheck className="w-4 h-4 text-blue-400" />}
                        </div>
                        <p className="text-xs text-white/40 line-clamp-2 mb-3">{shop.description}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-[10px] font-black">4.8</span>
                          </div>
                          <div className="flex items-center gap-1 text-white/20">
                            <MapPin className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Nearby</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-white/20">
                      <Store className="w-16 h-16 mb-4 opacity-10" />
                      <p className="text-sm font-black uppercase tracking-widest">No Establishments Found</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'operatives' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users.length > 0 ? users.map(user => (
                    <motion.div 
                      key={user.id}
                      onClick={() => onSelectUser(user)}
                      className="p-5 bg-white/5 border border-white/10 rounded-3xl hover:border-blue-500/40 transition-all cursor-pointer group flex items-center gap-4"
                    >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black shrink-0 ${
                        user.role === 'deliverer' ? 'bg-blue-500/20 border-2 border-blue-500/40 text-blue-400' : 'bg-zinc-500/20 border-2 border-zinc-500/40 text-zinc-400'
                      }`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">{user.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`w-2 h-2 rounded-full animate-pulse ${user.role === 'deliverer' ? 'bg-emerald-500' : 'bg-blue-400'}`} />
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                            {user.role === 'deliverer' ? 'Active Operative' : 'System Client'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-yellow-500 justify-end">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-[10px] font-black">{user.role === 'deliverer' ? '5.0' : '4.9'}</span>
                        </div>
                        <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest mt-1">Rating</p>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-white/20">
                      <Users className="w-16 h-16 mb-4 opacity-10" />
                      <p className="text-sm font-black uppercase tracking-widest">No Active Operatives</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-3">
                  {completedTasks.length > 0 ? completedTasks.map(task => (
                    <div 
                      key={task.id}
                      className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase italic">{task.description}</h4>
                          <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Completed {new Date(task.created_at || '').toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-500">€{task.price?.toFixed(2)}</p>
                        <p className="text-[8px] text-white/20 uppercase font-black tracking-tighter">Settled</p>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-20 text-white/20">
                      <History className="w-16 h-16 mb-4 opacity-10" />
                      <p className="text-sm font-black uppercase tracking-widest">No Mission History</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-black/40 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[8px] text-white/40 uppercase font-black tracking-widest">System Status</span>
                  <span className="text-[10px] text-emerald-500 font-black uppercase tracking-tighter">Nominal</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-white/40 uppercase font-black tracking-widest">Network Load</span>
                  <span className="text-[10px] text-blue-400 font-black uppercase tracking-tighter">2.4 TB/s</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-white/60 font-black uppercase tracking-widest italic">Encrypted Link Active</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
