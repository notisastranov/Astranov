import React from 'react';
import { Settings, LayoutGrid } from 'lucide-react';
import { HudButton } from '../ui/HudButton';

interface TopRightHUDProps {
  onSettingsClick: () => void;
  onEditLayoutClick: () => void;
  isEditMode?: boolean;
}

export const TopRightHUD: React.FC<TopRightHUDProps> = ({
  onSettingsClick,
  onEditLayoutClick,
  isEditMode = false,
}) => {
  return (
    <div className="flex gap-3">
      <HudButton 
        icon={LayoutGrid} 
        onClick={onEditLayoutClick} 
        label={isEditMode ? "Save Layout" : "Edit Layout"} 
        size="xl"
        active={isEditMode}
        status={isEditMode ? 'finance' : undefined}
      />
      <HudButton 
        icon={Settings} 
        onClick={onSettingsClick} 
        label="System Settings" 
        size="xl"
      />
    </div>
  );
};
