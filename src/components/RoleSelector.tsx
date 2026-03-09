import { UserRole } from '../types';
import { User, Truck, Store, Shield, CheckCircle2, Settings, Crown } from 'lucide-react';

interface RoleSelectorProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isVerifiedDriver: boolean;
  hasShop: boolean;
  isOwner?: boolean;
}

export default function RoleSelector({ currentRole, onRoleChange, isVerifiedDriver, hasShop, isOwner }: RoleSelectorProps) {
  const roles = [
    { id: 'user', label: 'User', icon: User, color: 'bg-blue-500', verified: true, description: 'Standard Access' },
    { id: 'deliverer', label: 'Deliverer', icon: Truck, color: 'bg-electric-blue', verified: isVerifiedDriver || isOwner, description: 'Logistics' },
    { id: 'vendor', label: 'Vendor', icon: Store, color: 'bg-purple-500', verified: hasShop || isOwner, description: 'Commerce' },
    { id: 'admin', label: 'Admin', icon: Shield, color: 'bg-red-500', verified: currentRole === 'admin' || isOwner, description: 'Authority' },
    { id: 'supervisor', label: 'Supervisor', icon: Settings, color: 'bg-orange-500', verified: currentRole === 'supervisor' || isOwner, description: 'Oversight' },
    { id: 'owner', label: 'Owner', icon: Crown, color: 'bg-purple-500', verified: isOwner, description: 'Creator' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {roles.map((role) => (
        <button
          key={role.id}
          onClick={() => onRoleChange(role.id as UserRole)}
          className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border transition-all ${
            currentRole === role.id 
              ? 'bg-white/10 border-white/20 text-white ring-1 ring-white/10' 
              : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          <div className="relative">
            <role.icon className={`w-5 h-5 ${currentRole === role.id ? 'text-white' : 'text-white/20'}`} />
            {role.verified && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border border-black shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            )}
          </div>
          <span className="text-[9px] uppercase tracking-widest font-black mt-1">{role.label}</span>
          <span className="text-[7px] uppercase tracking-[0.2em] opacity-40 font-bold">{role.description}</span>
        </button>
      ))}
    </div>
  );
}
