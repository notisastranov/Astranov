import React from 'react';
import { Settings } from 'lucide-react';
import { HudButton } from '../ui/HudButton';

interface TopRightHUDProps {
  onSettingsClick: () => void;
}

export const TopRightHUD: React.FC<TopRightHUDProps> = ({
  onSettingsClick,
}) => {
  return (
    <HudButton 
      icon={Settings} 
      onClick={onSettingsClick} 
      label="System Settings" 
      size="xl"
    />
  );
};
