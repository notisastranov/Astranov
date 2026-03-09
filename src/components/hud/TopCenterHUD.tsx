import React from 'react';
import { HudButton } from '../ui/HudButton';
import { HudButtonConfig } from '../../types';
import { getIconByName } from '../ui/IconHelper';

interface TopCenterHUDProps {
  buttons: HudButtonConfig[];
  onButtonClick: (id: string) => void;
}

export const TopCenterHUD: React.FC<TopCenterHUDProps> = ({
  buttons,
  onButtonClick,
}) => {
  return (
    <div className="flex items-center gap-2 sm:gap-4 bg-black/40 backdrop-blur-xl border border-white/10 p-2 sm:p-3 rounded-[24px] sm:rounded-[32px] shadow-2xl overflow-x-auto max-w-full no-scrollbar">
      {buttons
        .filter(b => b.enabled)
        .sort((a, b) => a.order - b.order)
        .map(button => (
          <HudButton 
            key={button.id}
            icon={getIconByName(button.icon)} 
            onClick={() => onButtonClick(button.id)} 
            label={button.label}
            status={button.status}
            data={button.data}
            size="xl"
            className="flex-shrink-0"
          />
        ))}
    </div>
  );
};
