import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SideActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
  side: 'left' | 'right';
  children: React.ReactNode;
  title?: string;
}

export const SideActionMenu: React.FC<SideActionMenuProps> = ({
  isOpen,
  onClose,
  anchorRect,
  side,
  children,
  title
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!anchorRect) return null;

  const top = anchorRect.top + anchorRect.height / 2;
  const left = side === 'left' ? anchorRect.right + 10 : anchorRect.left - 10;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] pointer-events-auto">
          {/* Backdrop to pause map interaction */}
          <div className="absolute inset-0 bg-transparent" onClick={onClose} />
          
          <motion.div
            ref={menuRef}
            initial={{ 
              opacity: 0, 
              scaleX: 0, 
              originX: side === 'left' ? 0 : 1,
              x: side === 'left' ? -20 : 20
            }}
            animate={{ 
              opacity: 1, 
              scaleX: 1, 
              x: 0
            }}
            exit={{ 
              opacity: 0, 
              scaleX: 0,
              x: side === 'left' ? -20 : 20
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              top: Math.max(20, Math.min(window.innerHeight - 320, top - 150)),
              left: side === 'left' ? left : left - 320,
              width: '320px',
              height: '300px',
            }}
            className="absolute pointer-events-auto"
          >
            {/* The Rectangular Glass Panel */}
            <div className="w-full h-full bg-zinc-900/90 backdrop-blur-2xl border border-blue-500/30 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.2)] relative overflow-hidden">
              {/* Futuristic Accent Lines */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
              <div className={`absolute top-0 bottom-0 w-1 bg-blue-500/50 ${side === 'left' ? 'left-0' : 'right-0'}`} />

              {/* Inner content container */}
              <div className="absolute inset-0 flex flex-col p-6">
                {title && (
                  <div className="mb-4 border-b border-white/10 pb-2 flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">{title}</span>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,1)]" />
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-center gap-3">
                  {children}
                </div>
              </div>

              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-blue-500/50" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-blue-500/50" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-blue-500/50" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-blue-500/50" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
