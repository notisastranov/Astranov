import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Monitor, Radio, Euro, Zap, User as UserIcon, 
  Cpu, HardDrive, Battery as BatteryIcon, Thermometer, 
  Bluetooth, Wifi, Signal, Globe, RadioTower,
  Plus, ArrowUpRight, History, Users, Shield, Lock,
  Power, X, RefreshCw, Play, Gamepad2, TrendingUp, Truck, Store
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User, UserRole, Transaction, Team, DeviceSpecs, NetworkSpecs } from '../types';
import RoleSelector from './RoleSelector';

interface StatusRibbonProps {
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

export default function StatusRibbon({ 
  balance, 
  userName, 
  userId,
  networkStatus, 
  deviceInfo,
  onToggleStatus,
  isActive,
  currentRole,
  onRoleChange,
  isVerifiedDriver,
  hasShop
}: StatusRibbonProps) {
  const [expandedPanel, setExpandedPanel] = useState<'device' | 'network' | 'balance' | 'user' | 'power' | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [realSpecs, setRealSpecs] = useState<DeviceSpecs>({
    cpu: "Detecting...",
    gpu: "Detecting...",
    ram: "Detecting...",
    storage: "Detecting...",
    battery: "Detecting...",
    temp: "32°C"
  });
  const [networkSpecs, setNetworkSpecs] = useState<NetworkSpecs & { magneticField: string, powerUsage: string }>({
    bluetooth: 'active',
    wifi: 'active',
    gsm: 'active',
    fiveG: 'active',
    longRange: 'inactive',
    magneticField: '45.2 µT',
    powerUsage: '1.2 W'
  });

  useEffect(() => {
    const detectHardware = async () => {
      const cores = navigator.hardwareConcurrency || 8;
      const ram = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory}GB` : "16GB";
      
      let batteryLevel = "100%";
      try {
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery();
          batteryLevel = `${Math.round(battery.level * 100)}%`;
        }
      } catch (e) {}

      setRealSpecs({
        cpu: `${cores}-Core ARM v9 (A710/A510)`,
        gpu: "Adreno 730 / M2 Ultra",
        ram: `${ram} LPDDR5X @ 4266MHz`,
        storage: "512GB UFS 4.0 NVMe",
        battery: batteryLevel,
        temp: `${32 + Math.floor(Math.random() * 5)}°C`
      });
    };
    detectHardware();

    // Simulate real-time network fluctuations
    const interval = setInterval(() => {
      setNetworkSpecs(prev => ({
        ...prev,
        magneticField: `${(40 + Math.random() * 10).toFixed(1)} µT`,
        powerUsage: `${(0.8 + Math.random() * 1.5).toFixed(2)} W`
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const chartData = transactions.slice(0, 10).reverse().map((tx, i) => ({
    name: i,
    value: tx.amount
  }));

  useEffect(() => {
    if (expandedPanel === 'balance') {
      fetch(`/api/transactions/${userId}`).then(res => res.json()).then(setTransactions);
    }
    if (expandedPanel === 'user') {
      fetch('/api/teams').then(res => res.json()).then(setTeams);
      fetch('/api/users').then(res => res.json()).then(setAllUsers);
    }
  }, [expandedPanel, userId]);

  const handlePanelToggle = (panel: 'device' | 'network' | 'balance' | 'user' | 'power') => {
    setExpandedPanel(expandedPanel === panel ? null : panel);
  };

  const handleAddFunds = async () => {
    const amount = 50;
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `tx-${Date.now()}`,
        user_id: userId,
        amount,
        type: 'deposit',
        description: 'Credit Card Deposit'
      })
    });
    fetch(`/api/transactions/${userId}`).then(res => res.json()).then(setTransactions);
  };

  const handleWithdraw = async () => {
    const amount = 50;
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `tx-${Date.now()}`,
        user_id: userId,
        amount,
        type: 'withdrawal',
        description: 'Bank Withdrawal'
      })
    });
    fetch(`/api/transactions/${userId}`).then(res => res.json()).then(setTransactions);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="grid grid-cols-5 gap-1 sm:gap-2 p-2 sm:p-2.5 rounded-[22px] bg-gradient-to-b from-[rgba(10,14,18,0.92)] to-[rgba(10,14,18,0.55)] border border-white/10 shadow-2xl backdrop-blur-ribbon">
        {/* Device */}
        <button 
          onClick={() => handlePanelToggle('device')}
          className={`pill flex items-center justify-center sm:justify-start ${expandedPanel === 'device' ? 'bg-electric-blue/20 border-electric-blue/40' : 'status-ok'} group`}
        >
          <Monitor className="w-4 h-4 text-white/60 group-hover:text-white transition-colors shrink-0" />
          <span className="text-[11px] uppercase tracking-widest font-black whitespace-nowrap hidden lg:inline">
            Device
          </span>
          <div className="pill-dot shrink-0" />
        </button>

        {/* Network */}
        <button 
          onClick={() => handlePanelToggle('network')}
          className={`pill flex items-center justify-center sm:justify-start ${expandedPanel === 'network' ? 'bg-electric-blue/20 border-electric-blue/40' : `status-${networkStatus}`} group`}
        >
          <Radio className="w-4 h-4 text-white/60 group-hover:text-white transition-colors shrink-0" />
          <span className="text-[11px] uppercase tracking-widest font-black whitespace-nowrap hidden lg:inline">
            Network
          </span>
          <div className="pill-dot shrink-0" />
        </button>

        {/* User (Central) */}
        <button 
          onClick={() => handlePanelToggle('user')}
          className={`pill flex items-center justify-center sm:justify-start ${expandedPanel === 'user' ? 'bg-electric-blue/20 border-electric-blue/40' : 'status-warn'} group`}
        >
          <UserIcon className="w-4 h-4 text-white/60 group-hover:text-white transition-colors shrink-0" />
          <span className="text-[11px] uppercase tracking-widest font-black whitespace-nowrap hidden lg:inline">
            {userName}
          </span>
          <div className="pill-dot shrink-0" />
        </button>

        {/* Economy */}
        <button 
          onClick={() => handlePanelToggle('balance')}
          className={`pill flex items-center justify-center sm:justify-start ${expandedPanel === 'balance' ? 'bg-electric-blue/20 border-electric-blue/40' : 'status-warn'} group`}
        >
          <Euro className="w-4 h-4 text-white/60 group-hover:text-white transition-colors shrink-0" />
          <span className="text-[11px] uppercase tracking-widest font-black whitespace-nowrap hidden lg:inline">
            {(balance || 0).toFixed(2)} €
          </span>
          <div className="pill-dot shrink-0" />
        </button>

        {/* Power / Demo */}
        <button 
          onClick={() => handlePanelToggle('power')}
          className={`pill flex items-center justify-center sm:justify-start ${expandedPanel === 'power' ? 'bg-electric-blue/20 border-electric-blue/40' : (isActive ? 'status-ok' : 'status-bad')} group`}
        >
          <Power className={`w-4 h-4 shrink-0 ${isActive ? 'text-ok' : 'text-bad'}`} />
          <span className="text-[11px] font-black uppercase tracking-widest hidden lg:inline">
            Power
          </span>
          <div className="pill-dot shrink-0" />
        </button>
      </div>

      {/* Expandable Panels */}
      <AnimatePresence>
        {expandedPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            className="bg-zinc-900/95 border border-white/10 rounded-[22px] overflow-hidden backdrop-blur-xl shadow-2xl"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-black">
                  {expandedPanel} System Diagnostics
                </h3>
                <button onClick={() => setExpandedPanel(null)} className="text-white/20 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {expandedPanel === 'device' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <SpecItem icon={<Cpu />} label="CPU" value={realSpecs.cpu} />
                  <SpecItem icon={<Zap />} label="GPU" value={realSpecs.gpu} />
                  <SpecItem icon={<HardDrive />} label="RAM" value={realSpecs.ram} />
                  <SpecItem icon={<HardDrive />} label="Storage" value={realSpecs.storage} />
                  <SpecItem icon={<BatteryIcon />} label="Battery" value={realSpecs.battery} />
                  <SpecItem icon={<Thermometer />} label="Temp" value={realSpecs.temp} />
                </div>
              )}

              {expandedPanel === 'network' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <NetworkItem icon={<Bluetooth />} label="Bluetooth" status={networkSpecs.bluetooth} />
                    <NetworkItem icon={<Wifi />} label="Wi-Fi" status={networkSpecs.wifi} />
                    <NetworkItem icon={<Signal />} label="GSM" status={networkSpecs.gsm} />
                    <NetworkItem icon={<Globe />} label="5G" status={networkSpecs.fiveG} />
                    <NetworkItem icon={<RadioTower />} label="Long Range" status={networkSpecs.longRange} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Magnetic Field (EMI)</p>
                      <p className="text-xl font-black text-electric-blue">{networkSpecs.magneticField}</p>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                        <motion.div 
                          animate={{ width: ['20%', '80%', '40%'] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="h-full bg-electric-blue" 
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">RF Power Density</p>
                      <p className="text-xl font-black text-ok">{networkSpecs.powerUsage}</p>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                        <motion.div 
                          animate={{ width: ['60%', '30%', '90%'] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="h-full bg-ok" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {expandedPanel === 'balance' && (
                <div className="space-y-6">
                  <div className="h-[150px] w-full bg-white/5 rounded-xl border border-white/5 p-4">
                    <div className="flex items-center gap-2 mb-2 text-white/40 text-[10px] uppercase tracking-widest">
                      <TrendingUp className="w-3 h-3" /> Economic Activity
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#00d2ff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke="#00d2ff" fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={handleAddFunds}
                      className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-xl transition-all"
                    >
                      <Plus className="w-4 h-4 text-ok" />
                      <span className="text-sm font-bold">Add Funds</span>
                    </button>
                    <button 
                      onClick={handleWithdraw}
                      className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-xl transition-all"
                    >
                      <ArrowUpRight className="w-4 h-4 text-electric-blue" />
                      <span className="text-sm font-bold">Withdraw</span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest">
                      <History className="w-3 h-3" /> Transaction History
                    </div>
                    <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {transactions.length === 0 ? (
                        <div className="text-center py-4 text-white/20 text-xs italic">No recent transactions</div>
                      ) : (
                        transactions.map(tx => (
                          <div key={tx.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                            <div>
                              <p className="text-xs font-bold">{tx.description}</p>
                              <p className="text-[10px] text-white/40">{new Date(tx.timestamp).toLocaleDateString()}</p>
                            </div>
                            <span className={`text-xs font-mono font-bold ${tx.type === 'deposit' || tx.type === 'earnings' ? 'text-ok' : 'text-bad'}`}>
                              {tx.type === 'deposit' || tx.type === 'earnings' ? '+' : '-'}{tx.amount.toFixed(2)} €
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {expandedPanel === 'user' && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest">
                      <Users className="w-3 h-3" /> Role Management
                    </div>
                    <RoleSelector 
                      currentRole={currentRole} 
                      onRoleChange={onRoleChange} 
                      isVerifiedDriver={isVerifiedDriver}
                      hasShop={hasShop}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest">
                      <Gamepad2 className="w-3 h-3" /> Astranov Games
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <GameButton icon={<Truck />} label="Dash" />
                      <GameButton icon={<Store />} label="Tycoon" />
                      <GameButton icon={<Globe />} label="Explore" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TeamCard icon={<Globe />} label="Global Team" count={teams.filter(t => t.type === 'global').length} />
                    <TeamCard icon={<Shield />} label="Local Team" count={teams.filter(t => t.type === 'local').length} />
                    <TeamCard icon={<Lock />} label="Private Team" count={teams.filter(t => t.type === 'private').length} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest">
                      <Users className="w-3 h-3" /> Team Management
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {allUsers.slice(0, 8).map(u => (
                        <div key={u.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
                          <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold">
                            {u.name.charAt(0)}
                          </div>
                          <span className="text-[10px] truncate">{u.name}</span>
                        </div>
                      ))}
                      <button className="flex items-center justify-center p-2 border border-dashed border-white/20 rounded-lg text-[10px] text-white/40 hover:text-white hover:border-white/40 transition-all">
                        + Invite Member
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {expandedPanel === 'power' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <PowerButton 
                      icon={<Power />} 
                      label="On" 
                      color="text-ok" 
                      onClick={() => onToggleStatus(true)} 
                      active={isActive}
                    />
                    <PowerButton 
                      icon={<Power />} 
                      label="Off" 
                      color="text-bad" 
                      onClick={() => onToggleStatus(false)} 
                      active={!isActive}
                    />
                    <PowerButton 
                      icon={<RefreshCw />} 
                      label="Reboot" 
                      color="text-warn" 
                      onClick={() => window.location.reload()} 
                    />
                    <PowerButton 
                      icon={<Play />} 
                      label="Demo" 
                      color="text-electric-blue" 
                      onClick={() => {
                        setExpandedPanel(null);
                        // Demo logic in App.tsx will handle this via event or prop
                        window.dispatchEvent(new CustomEvent('astranov-demo'));
                      }} 
                    />
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">System Status</p>
                    <p className="text-xs font-bold text-white">
                      {isActive ? 'All systems operational. Ready for deployment.' : 'System standby. Manual activation required.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .pill {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          height: 2.5rem;
          padding-left: 0.5rem;
          padding-right: 0.5rem;
          border-radius: 9999px;
          border-width: 1px;
          border-color: rgba(255, 255, 255, 0.1);
          background-color: rgba(255, 255, 255, 0.05);
          color: white;
          cursor: pointer;
          user-select: none;
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }
        @media (min-width: 640px) {
          .pill {
            gap: 0.625rem;
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }
        .pill:hover {
          border-color: rgba(0, 210, 255, 0.4);
          background-color: rgba(0, 210, 255, 0.05);
        }
        .pill:active {
          transform: scale(0.99);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

function SpecItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center gap-4">
      <div className="text-electric-blue/60">{icon}</div>
      <div>
        <p className="text-[10px] text-white/40 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function NetworkItem({ icon, label, status }: { icon: React.ReactNode, label: string, status: 'active' | 'inactive' }) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${status === 'active' ? 'bg-ok/5 border-ok/20' : 'bg-white/5 border-white/5 opacity-40'}`}>
      <div className={status === 'active' ? 'text-ok' : 'text-white/40'}>{icon}</div>
      <p className="text-[10px] uppercase tracking-tighter font-bold">{label}</p>
      <div className={`w-1 h-1 rounded-full ${status === 'active' ? 'bg-ok shadow-[0_0_8px_rgba(53,242,166,0.8)]' : 'bg-white/20'}`} />
    </div>
  );
}

function TeamCard({ icon, label, count }: { icon: React.ReactNode, label: string, count: number }) {
  return (
    <button className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-4 transition-all text-left">
      <div className="text-purple-400">{icon}</div>
      <div>
        <p className="text-[10px] text-white/40 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-white">{count} Active</p>
      </div>
    </button>
  );
}

function GameButton({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group">
      <div className="text-electric-blue group-hover:scale-110 transition-transform">{icon}</div>
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function PowerButton({ icon, label, color, onClick, active }: { icon: React.ReactNode, label: string, color: string, onClick: () => void, active?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all ${
        active ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 hover:bg-white/10'
      }`}
    >
      <div className={`${color} ${active ? 'scale-110' : ''} transition-transform`}>{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
