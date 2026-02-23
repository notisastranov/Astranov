import { motion, AnimatePresence } from 'motion/react';
import { Task, UserRole } from '../types';
import { Package, ShoppingBag, Gamepad2, Wrench, X, Zap } from 'lucide-react';

interface TaskDrawerProps {
  tasks: Task[];
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (taskId: string) => void;
  onStartDemo?: () => void;
  newTaskId?: string | null;
  userRole: UserRole;
  isDemoMode?: boolean;
}

export default function TaskDrawer({ tasks, isOpen, onClose, onAccept, onStartDemo, newTaskId, userRole, isDemoMode }: TaskDrawerProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'delivery': return <Package className="w-5 h-5" />;
      case 'shopping': return <ShoppingBag className="w-5 h-5" />;
      case 'game': return <Gamepad2 className="w-5 h-5" />;
      default: return <Wrench className="w-5 h-5" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-80 bg-black/90 backdrop-blur-2xl border-l border-white/10 z-[1400] p-6 overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-white text-xl font-light tracking-widest uppercase italic font-black">Live Activity</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {!isDemoMode && (
              <button 
                onClick={onStartDemo}
                className="w-full p-4 rounded-2xl border border-electric-blue/30 bg-electric-blue/5 flex items-center justify-between group hover:bg-electric-blue/10 transition-all mb-6"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-electric-blue animate-pulse" />
                  <div className="text-left">
                    <p className="text-white text-[10px] font-black uppercase tracking-widest">Simulation Mode</p>
                    <p className="text-white/40 text-[9px] uppercase tracking-widest">Populate city with agents</p>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-electric-blue/20 flex items-center justify-center text-electric-blue group-hover:scale-110 transition-transform">
                  →
                </div>
              </button>
            )}

            {tasks.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-white/20 text-[10px] uppercase tracking-widest font-black">No active missions</p>
              </div>
            ) : (
              tasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={task.id === newTaskId ? { scale: 0.9, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`p-4 rounded-2xl border ${task.id === newTaskId ? 'border-electric-blue/50 bg-electric-blue/10 animate-pulse' : 'border-white/5 bg-white/5'} transition-all`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${task.status === 'completed' ? 'bg-ok/20 text-ok' : 'bg-white/10 text-white'}`}>
                        {getIcon(task.type)}
                      </div>
                      <span className="text-white/40 text-[10px] uppercase tracking-widest font-black">{task.type}</span>
                    </div>
                    <span className="text-white font-black text-sm italic">€{(task.price || 0).toFixed(2)}</span>
                  </div>
                  <p className="text-white text-sm font-bold leading-tight mb-3">{task.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'completed' ? 'bg-ok' : 'bg-electric-blue animate-pulse'}`} />
                      <span className="text-[9px] uppercase font-black tracking-widest text-white/60">{task.status.replace('_', ' ')}</span>
                    </div>
                    {userRole === 'deliverer' && task.status === 'pending_driver' && (
                      <button 
                        onClick={() => onAccept?.(task.id)}
                        className="px-4 py-1.5 bg-electric-blue text-black text-[9px] uppercase tracking-widest font-black rounded-lg hover:scale-105 transition-all"
                      >
                        Accept
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
