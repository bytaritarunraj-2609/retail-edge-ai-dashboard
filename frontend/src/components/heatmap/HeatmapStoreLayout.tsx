import React from 'react';
import { Shelf, QueueStatus } from '../../types';
import { SharedStoreLayout } from '../store-map/SharedStoreLayout';
import { HeatmapZonePanel } from './HeatmapZonePanel';
import { GlobalHeatmapOverlay } from './GlobalHeatmapOverlay';

interface HeatmapStoreLayoutProps {
  shelves: Shelf[];
  queue: QueueStatus;
  selectedShelfId: number | null;
  onShelfClick: (id: number) => void;
}

export function HeatmapStoreLayout({ shelves, queue, selectedShelfId, onShelfClick }: HeatmapStoreLayoutProps) {
  
  // Base intensity is calculated globally, but we pass dummy/clean props to ZonePanel 
  // since it now only handles interaction, borders, and hover info.
  const getIntensityForShelf = (shelf: Shelf) => {
    let baseIntensity = 0.2;
    if (shelf.activityLevel === 'MEDIUM') baseIntensity = 0.5;
    if (shelf.activityLevel === 'HIGH') baseIntensity = 0.8;

    if (shelf.category === 'Checkout') {
      if (queue.severity === 'CRITICAL') {
        baseIntensity = 1.0;
      } else if (queue.severity === 'HIGH') {
        baseIntensity = 0.8;
      } else if (queue.severity === 'ELEVATED') {
        baseIntensity = 0.6;
      } else {
        baseIntensity = 0.3;
      }
    }
    return baseIntensity;
  };

  return (
    <SharedStoreLayout 
      shelves={shelves} 
      overlay={<GlobalHeatmapOverlay shelves={shelves} queue={queue} />}
      renderShelf={(shelf) => (
        <HeatmapZonePanel
          key={shelf.id}
          shelf={shelf}
          intensity={getIntensityForShelf(shelf)}
          isSelected={selectedShelfId === shelf.id}
          onClick={() => onShelfClick(shelf.id)}
        />
      )} 
    />
  );
}
