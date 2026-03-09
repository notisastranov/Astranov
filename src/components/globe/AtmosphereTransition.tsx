import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AtmosphereTransitionProps {
  isZooming: boolean;
  progress: number;
}

export default function AtmosphereTransition({ isZooming, progress }: AtmosphereTransitionProps) {
  return (
    <AnimatePresence>
      {isZooming && progress > 0.7 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-[2000] bg-white pointer-events-none"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-white/40 mix-blend-overlay" />
          <motion.div 
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 2, opacity: 1 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-full h-full bg-white/10 backdrop-blur-sm" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
