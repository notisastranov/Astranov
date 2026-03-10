import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AppShellProps {
  children: React.ReactNode;
  leftHUD?: React.ReactNode;
  rightHUD?: React.ReactNode;
  topCenterHUD?: React.ReactNode;
  topRightHUD?: React.ReactNode;
  bottomCenterAIBar?: React.ReactNode;
  bottomRightRadar?: React.ReactNode;
  bottomCenterHUD?: React.ReactNode;
  overlayPanels?: React.ReactNode;
  versionBar?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  leftHUD,
  rightHUD,
  topCenterHUD,
  topRightHUD,
  bottomCenterAIBar,
  bottomRightRadar,
  bottomCenterHUD,
  overlayPanels,
  versionBar,
}) => {
  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-sans text-white">
      {/* Version Bar */}
      {versionBar}

      {/* Main Scene (Globe or Map) */}
      <div className="absolute inset-0 z-0">
        {children}
      </div>

      {/* HUD Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        
        {/* Top Center HUD */}
        <div className="absolute top-8 sm:top-10 left-1/2 -translate-x-1/2 pointer-events-auto flex justify-center w-full sm:w-auto px-4">
          {topCenterHUD}
        </div>

        {/* Top Right HUD */}
        <div className="absolute top-8 sm:top-10 right-4 sm:right-8 pointer-events-auto">
          {topRightHUD}
        </div>

        {/* Left HUD Column */}
        <div className="absolute top-24 sm:top-32 bottom-24 sm:bottom-32 left-4 sm:left-8 w-16 sm:w-20 flex flex-col items-center justify-start pointer-events-auto">
          {leftHUD}
        </div>

        {/* Right HUD Column */}
        <div className="absolute top-24 sm:top-32 bottom-24 sm:bottom-32 right-4 sm:right-8 w-16 sm:w-20 flex flex-col items-center justify-start pointer-events-auto">
          {rightHUD}
        </div>

        {/* Bottom Center HUD (Extra buttons) */}
        <div className="absolute bottom-24 sm:bottom-32 left-1/2 -translate-x-1/2 pointer-events-auto">
          {bottomCenterHUD}
        </div>

        {/* Bottom Center AI Bar */}
        <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 sm:px-8 pointer-events-auto z-20">
          {bottomCenterAIBar}
        </div>

        {/* Bottom Right Radar */}
        <div className="absolute bottom-6 sm:bottom-10 right-4 sm:right-8 pointer-events-auto">
          {bottomRightRadar}
        </div>

      </div>

      {/* Overlay Panels Layer */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        {overlayPanels}
      </div>
    </div>
  );
};
