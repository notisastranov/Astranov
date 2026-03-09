import React from 'react';
import { AnimatePresence } from 'motion/react';

interface OverlayPanelsLayerProps {
  children: React.ReactNode;
}

export const OverlayPanelsLayer: React.FC<OverlayPanelsLayerProps> = ({
  children,
}) => {
  return (
    <AnimatePresence mode="wait">
      {children}
    </AnimatePresence>
  );
};
