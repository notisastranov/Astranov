import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Shield, LogOut, LogIn, Fingerprint, Key, Phone, Mail, BadgeCheck, Settings, Wrench, Eye, EyeOff, Cpu } from 'lucide-react';
import { UserRole, User as UserType } from '../types';
import RoleSelector from './RoleSelector';

interface UserWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  isAuthenticated: boolean;
  onLogin: (username: string, password: string, email?: string, mode?: 'login' | 'signup') => void;
  onLogout: () => void;
  onBiometricLogin: () => void;
  onRoleChange: (role: UserRole) => void;
  hasShop: boolean;
}

export default function UserWidget({ 
  isOpen, 
  onClose, 
  currentUser, 
  isAuthenticated, 
  onLogin, 
  onLogout,
  onBiometricLogin,
  onRoleChange,
  hasShop
}: UserWidgetProps) {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'profile'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deviceSignature, setDeviceSignature] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password, email, authMode === 'signup' ? 'signup' : 'login');
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner': return <Shield className="w-4 h-4 text-purple-500" />;
      case 'admin': return <Shield className="w-4 h-4 text-red-500" />;
      case 'supervisor': return <Settings className="w-4 h-4 text-orange-500" />;
      default: return <User className="w-4 h-4 text-blue-500" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'System Owner';
      case 'admin': return 'Administrator';
      case 'supervisor': return 'Supervisor';
      case 'user': return 'User';
      case 'deliverer': return 'Deliverer';
      case 'vendor': return 'Vendor';
      default: return role;
    }
  };

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'Ultimate system authority. Creator and owner of the Astranov platform.';
      case 'admin': return 'Full system authority. Can modify application logic and UI.';
      case 'supervisor': return 'Maintenance and oversight access. Can perform system updates.';
      case 'user': return 'Standard operational access for all system features.';
      case 'deliverer': return 'Authorized for logistics and delivery operations.';
      case 'vendor': return 'Authorized for commercial and shop management.';
      default: return 'Limited access.';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900/95 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight italic">
                    {isAuthenticated ? 'Profile' : 'Auth'}
                  </h3>
                  <p className="text-[8px] text-white/40 uppercase tracking-widest">
                    {isAuthenticated ? 'Secure' : 'Link Required'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {isAuthenticated && currentUser ? (
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-lg font-black">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">{currentUser.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {getRoleIcon(currentUser.role)}
                        <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest">
                          {getRoleLabel(currentUser.role)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Permissions Info */}
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="w-3 h-3 text-emerald-500" />
                      <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">Access Level</span>
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed">
                      {getRoleDescription(currentUser.role)}
                    </p>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-white/40 uppercase tracking-widest ml-1">Switch Role</label>
                    <RoleSelector 
                      currentRole={currentUser.role}
                      onRoleChange={onRoleChange}
                      isVerifiedDriver={!!currentUser.is_verified_driver}
                      hasShop={hasShop}
                      isOwner={currentUser.role === 'owner'}
                    />
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={onLogout}
                      className="w-full py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Terminate Session
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-white/60 text-[8px] uppercase tracking-widest mb-1.5 ml-1">User ID / Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors text-xs"
                        placeholder="ID-8829-X / +1..."
                        required
                      />
                    </div>
                  </div>

                  {authMode === 'signup' && (
                    <>
                      <div>
                        <label className="block text-white/60 text-[8px] uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                          <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors text-xs"
                            placeholder="user@astranov.net"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-white/60 text-[8px] uppercase tracking-widest mb-1.5 ml-1">Device Signature</label>
                        <div className="relative">
                          <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                          <input 
                            type="text" 
                            value={deviceSignature}
                            onChange={(e) => setDeviceSignature(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors text-xs"
                            placeholder="HW-SIG-XXXX-XXXX"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-white/60 text-[8px] uppercase tracking-widest mb-1.5 ml-1">Access Key</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors text-xs"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="w-10 h-10 flex items-center justify-center bg-black border border-white/10 rounded-lg text-white/40 hover:text-white hover:border-white/20 transition-all shrink-0"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      type="submit"
                      className="flex-1 bg-blue-600 text-white font-black py-3 rounded-lg uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 text-[10px] flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      {authMode === 'login' ? 'Establish Link' : 'Register'}
                    </button>
                    {authMode === 'login' && (
                      <button 
                        type="button"
                        onClick={onBiometricLogin}
                        className="w-12 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white hover:bg-white/10 transition-all"
                      >
                        <Fingerprint className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="pt-2 text-center">
                    <button 
                      type="button" 
                      onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                      className="text-[8px] text-white/40 hover:text-white uppercase tracking-widest transition-all"
                    >
                      {authMode === 'login' ? "No ID? " : "Registered? "}
                      <span className="text-blue-400">{authMode === 'login' ? 'Create' : 'Login'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_0%,rgba(0,210,255,0.02)_50%,transparent_100%)] bg-[length:100%_4px] animate-scanline" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
