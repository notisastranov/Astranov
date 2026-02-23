import { UserRole } from '../types';
import { User, Truck, Store, Shield, CheckCircle2 } from 'lucide-react';

interface RoleSelectorProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isVerifiedDriver: boolean;
  hasShop: boolean;
}

export default function RoleSelector({ currentRole, onRoleChange, isVerifiedDriver, hasShop }: RoleSelectorProps) {
  const roles = [
    { id: 'customer', label: 'Customer', icon: User, color: 'bg-blue-500', verified: true },
    { id: 'deliverer', label: 'Deliverer', icon: Truck, color: 'bg-electric-blue', verified: isVerifiedDriver },
    { id: 'vendor', label: 'Vendor', icon: Store, color: 'bg-purple-500', verified: hasShop },
    { id: 'admin', label: 'Admin', icon: Shield, color: 'bg-red-500', verified: true },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => (
        <button
          key={role.id}
          onClick={() => onRoleChange(role.id as UserRole)}
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
            currentRole === role.id 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
          }`}
        >
          <role.icon className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-widest font-black">{role.label}</span>
          {role.verified && <CheckCircle2 className="w-2 h-2 text-emerald-500" />}
        </button>
      ))}
    </div>
  );
}
