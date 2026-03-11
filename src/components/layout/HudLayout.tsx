import React from 'react';

interface HudLayoutProps {
  topStrip?: React.ReactNode;
  leftHUD?: React.ReactNode;
  rightHUD?: React.ReactNode;
  aiCommandBar?: React.ReactNode;
  bottomRightRadar?: React.ReactNode;
  center?: React.ReactNode;
}

export const HudLayout: React.FC<HudLayoutProps> = ({
  topStrip,
  leftHUD,
  rightHUD,
  aiCommandBar,
  bottomRightRadar,
  center
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col overflow-hidden font-sans select-none">
      {/* TOP STRIP */}
      <div className="z-[100]">
        {topStrip}
      </div>

      {/* MIDDLE ZONE */}
      <div className="flex-1 flex justify-between items-start pt-14 px-4 relative">
        {/* LEFT HUD */}
        <div className="z-40">
          {leftHUD}
        </div>

        {/* CENTER AREA (Transparent for Map) */}
        <div className="flex-1 h-full pointer-events-none">
          {center}
        </div>

        {/* RIGHT HUD */}
        <div className="z-40">
          {rightHUD}
        </div>
      </div>

      {/* BOTTOM ZONE */}
      <div className="mt-auto w-full p-6 flex justify-center items-end relative min-h-[140px]">
        {/* Radar - Positioned in corner, lower z-index than AI Bar */}
        <div className="absolute bottom-6 right-6 z-30 pointer-events-auto">
          {bottomRightRadar}
        </div>

        {/* AI Command Bar - Centered, higher z-index */}
        <div className="w-full max-w-2xl z-50 pointer-events-auto">
          {aiCommandBar}
        </div>
      </div>
    </div>
  );
};
