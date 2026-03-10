import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'motion/react';
import { HudButton } from '../ui/HudButton';
import { HudButtonConfig, HudRegion } from '../../types';
import { getIconByName } from '../ui/IconHelper';

interface GridHUDProps {
  buttons: HudButtonConfig[];
  region: HudRegion;
  onButtonClick: (id: string) => void;
  isEditMode?: boolean;
  onLayoutChange?: (buttons: HudButtonConfig[]) => void;
}

export const GridHUD: React.FC<GridHUDProps> = ({
  buttons,
  region,
  onButtonClick,
  isEditMode = false,
  onLayoutChange,
}) => {
  const [items, setItems] = useState(buttons);

  useEffect(() => {
    setItems(buttons);
  }, [buttons]);

  const handleReorder = (newOrder: HudButtonConfig[]) => {
    setItems(newOrder);
    if (onLayoutChange) {
      onLayoutChange(newOrder.map((item, index) => ({ ...item, order: index })));
    }
  };

  const containerStyles = {
    left: "flex flex-col gap-3 sm:gap-4 items-center",
    right: "flex flex-col gap-3 sm:gap-4 items-center",
    top: "flex flex-row gap-3 sm:gap-4 items-center justify-center",
    'bottom-center': "flex flex-row gap-3 sm:gap-4 items-center justify-center",
    'bottom-right': "flex flex-col gap-3 sm:gap-4 items-end",
  };

  if (isEditMode) {
    return (
      <Reorder.Group
        axis={region === 'top' || region === 'bottom-center' ? "x" : "y"}
        values={items}
        onReorder={handleReorder}
        className={containerStyles[region]}
      >
        {items.map((button) => (
          <Reorder.Item key={button.id} value={button}>
            <div className="cursor-move opacity-80 hover:opacity-100 transition-opacity">
              <HudButton
                icon={getIconByName(button.icon)}
                label={button.label}
                status={button.status}
                data={button.data}
                size={region === 'top' ? 'md' : 'xl'}
                disabled={true}
              />
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    );
  }

  return (
    <div className={containerStyles[region]}>
      {items
        .filter(b => b.enabled)
        .sort((a, b) => a.order - b.order)
        .map((button) => (
          <HudButton
            key={button.id}
            icon={getIconByName(button.icon)}
            onClick={() => onButtonClick(button.id)}
            label={button.label}
            status={button.status}
            data={button.data}
            size={region === 'top' ? 'md' : 'xl'}
          />
        ))}
    </div>
  );
};
