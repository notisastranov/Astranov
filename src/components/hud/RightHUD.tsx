import React from 'react';
import { HudButton } from '../ui/HudButton';
import { HudButtonConfig } from '../../types';
import { getIconByName } from '../ui/IconHelper';

interface RightHUDProps {
  buttons: HudButtonConfig[];
  onButtonClick: (id: string) => void;
}

export const RightHUD: React.FC<RightHUDProps> = ({
  buttons,
  onButtonClick,
}) => {
  return (
    <div className="flex flex-col gap-4">
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
          />
        ))}
    </div>
  );
};
