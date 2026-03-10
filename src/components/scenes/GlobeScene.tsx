import React from 'react';
import GlobeScene from '../GlobeScene';

interface GlobeSceneWrapperProps {
  onSignalSelect: (signal: any) => void;
  isZooming: boolean;
  onTransitionComplete: () => void;
  viewState: 'orbital' | 'map' | 'city';
}

export const GlobeSceneWrapper: React.FC<GlobeSceneWrapperProps> = (props) => {
  return <GlobeScene {...props} />;
};
