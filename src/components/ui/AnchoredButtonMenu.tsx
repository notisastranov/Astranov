import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AnchoredButtonMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
  side: 'left' | 'right';
  children: React.ReactNode;
  title?: string;
}

export const AnchoredButtonMenu: React.FC<AnchoredButtonMenuProps> = ({
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

  // Calculate position to be "attached" to the button
  const top = anchorRect.top;
  const left = side === 'left' ? anchorRect.right + 8 : anchorRect.left - 268; // 260 width + 8 gap

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] pointer-events-none">
          {/* Transparent backdrop to catch clicks but not block map entirely */}
          <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={onClose} />
          
          <motion.div
            ref={menuRef}
            initial={{ 
              opacity: 0, 
              scale: 0.95,
              x: side === 'left' ? -10 : 10
            }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: 0
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.95,
              x: side === 'left' ? -10 : 10
            }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              top: Math.max(10, Math.min(window.innerHeight - 310, top)),
              left: left,
              width: '260px',
            }}
            className="absolute pointer-events-auto"
          >
            {/* Rectangular Glass Panel */}
            <div className="w-full bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.6)] relative overflow-hidden">
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

              {/* Content container */}
              <div className="flex flex-col p-3">
                {title && (
                  <div className="mb-2 border-b border-white/5 pb-1.5 flex items-center justify-between">
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.3em] italic">{title}</span>
                    <div className="w-1 h-1 rounded-full bg-blue-500/50" />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  {children}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
