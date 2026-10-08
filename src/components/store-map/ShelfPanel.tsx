import React from 'react';
import { Shelf, Camera } from '../../types';

interface ShelfPanelProps {
  shelf: Shelf;
  camera: Camera;
  isSelected: boolean;
  onClick: () => void;
}

export function ShelfPanel({ shelf, camera, isSelected, onClick }: ShelfPanelProps) {
  const shelfStatusClass = shelf.status.toLowerCase();
  const cameraStateClass = camera.state.toLowerCase();
  
  return (
    <button 
      className={`shelf-panel ${shelfStatusClass} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="shelf-header">
        <span>Shelf {String(shelf.id).padStart(2, '0')}</span>
        <div className="cam-module">
          <span className="cam-label">CAM {String(camera.id).padStart(2, '0')}</span>
          <div className={`cam-indicator ${cameraStateClass}`}>
            <i className="cam-led" />
          </div>
        </div>
      </div>
      
      <div className="shelf-body">
        <small className="product-name">{shelf.product}</small>
        
        {shelf.status !== 'NORMAL' && (
          <div className="shelf-alert">
            <span className="alert-text">{shelf.status.replace('_', ' ')}</span>
          </div>
        )}
      </div>
    </button>
  );
}
