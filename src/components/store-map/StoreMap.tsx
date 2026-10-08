import React from 'react';
import { ShelfPanel } from './ShelfPanel';
import { SharedStoreLayout } from './SharedStoreLayout';
import { Shelf, Camera } from '../../types';

interface StoreMapProps {
  shelves: Shelf[];
  cameras: Camera[];
  selectedShelfId: number | null;
  onShelfClick: (id: number) => void;
}

export function StoreMap({ shelves, cameras, selectedShelfId, onShelfClick }: StoreMapProps) {
  const getCameraForShelf = (shelfId: number) => {
    return cameras.find(c => c.id === shelfId) || cameras[0];
  };

  return (
    <SharedStoreLayout 
      shelves={shelves} 
      renderShelf={(shelf) => (
        <ShelfPanel
          key={shelf.id}
          shelf={shelf}
          camera={getCameraForShelf(shelf.id)}
          isSelected={selectedShelfId === shelf.id}
          onClick={() => onShelfClick(shelf.id)}
        />
      )} 
    />
  );
}
