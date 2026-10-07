import React from 'react';
import { Shelf, QueueStatus } from '../../types';

interface GlobalHeatmapOverlayProps {
  shelves: Shelf[];
  queue: QueueStatus;
}

export function GlobalHeatmapOverlay({ shelves, queue }: GlobalHeatmapOverlayProps) {

  // Helper to determine intensity based on shelf activity and queue
  const getIntensityForShelf = (shelf: Shelf) => {
    let baseIntensity = 0.2;
    if (shelf.activityLevel === 'MEDIUM') baseIntensity = 0.5;
    if (shelf.activityLevel === 'HIGH') baseIntensity = 0.8;

    let noise = (shelf.id % 3) * 0.05;
    
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
      noise = 0;
    }

    return Math.min(1.0, Math.max(0.0, baseIntensity + noise));
  };

  // Map shelf ID to approximate global (x,y) percentages, with intentional organic jitter
  const getCoordinatesForShelf = (shelfId: number) => {
    let baseCol = 0;
    let rowIdx = 0;
    
    if (shelfId <= 10) { // Aisle A
      baseCol = (shelfId % 2) !== 0 ? 18 : 38; 
      rowIdx = Math.floor((shelfId - 1) / 2);
    } else { // Aisle B
      baseCol = (shelfId % 2) !== 0 ? 62 : 82; 
      rowIdx = Math.floor((shelfId - 11) / 2);
    }
    
    const baseRow = 15 + (rowIdx * 20); 

    // Deterministic organic jitter to break grid alignment
    const jitterX = ((shelfId * 13) % 7) - 3; // -3% to +3%
    const jitterY = ((shelfId * 17) % 9) - 4; // -4% to +4%

    // Push central hotspots closer together to merge the gap
    let finalCol = baseCol + jitterX;
    if (finalCol > 30 && finalCol < 50) finalCol += 4; // push A right closer to center
    if (finalCol > 50 && finalCol < 70) finalCol -= 4; // push B left closer to center

    return { x: finalCol, y: baseRow + jitterY };
  };

  // Generate radial gradient based on intensity
  const getHeatGradient = (value: number, isElongated: boolean, isVertical: boolean) => {
    const shape = isElongated ? (isVertical ? 'ellipse 40% 60%' : 'ellipse 60% 40%') : 'circle';
    
    if (value <= 0.2) {
      return `radial-gradient(${shape}, rgba(30,58,138,0.4) 0%, rgba(30,58,138,0.1) 30%, transparent 70%)`; 
    }
    if (value <= 0.4) {
      return `radial-gradient(${shape}, rgba(59,130,246,0.5) 0%, rgba(30,58,138,0.25) 40%, transparent 80%)`; 
    }
    if (value <= 0.6) {
      return `radial-gradient(${shape}, rgba(168,85,247,0.6) 0%, rgba(59,130,246,0.3) 40%, rgba(30,58,138,0.15) 70%, transparent 90%)`; 
    }
    if (value <= 0.8) {
      return `radial-gradient(${shape}, rgba(239,68,68,0.7) 0%, rgba(249,115,22,0.4) 25%, rgba(168,85,247,0.3) 50%, rgba(59,130,246,0.1) 80%, transparent 100%)`; 
    }
    // High intensity
    return `radial-gradient(${shape}, rgba(234,179,8,0.9) 0%, rgba(249,115,22,0.7) 20%, rgba(239,68,68,0.5) 40%, rgba(168,85,247,0.3) 65%, rgba(59,130,246,0.1) 90%, transparent 100%)`; 
  };

  return (
    <div 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0, 
        overflow: 'hidden', 
        borderRadius: '8px'
      }}
    >
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15,23,42,0.5)', 
          zIndex: 0
        }}
      />
      
      {shelves.map(shelf => {
        let intensity = getIntensityForShelf(shelf);
        
        // Randomize intensity slightly so identical base intensities don't look artificial
        intensity = Math.min(1.0, Math.max(0.1, intensity + (((shelf.id * 7) % 11) - 5) * 0.02));

        const { x, y } = getCoordinatesForShelf(shelf.id);
        
        // Base blob size is significantly larger and varies per node
        const sizeVariance = ((shelf.id * 11) % 50) - 25; // -25 to +25
        const baseSize = 350 + (intensity * 450) + sizeVariance; 

        // Organic shape determination
        const isElongated = shelf.id % 3 === 0 || intensity > 0.7; // High traffic creates stretched corridors
        const isVertical = shelf.id % 4 === 0;

        const width = isElongated && !isVertical ? baseSize * 1.4 : baseSize;
        const height = isElongated && isVertical ? baseSize * 1.4 : baseSize;

        return (
          <div 
            key={shelf.id}
            style={{
              position: 'absolute',
              top: `${y}%`,
              left: `${x}%`,
              width: `${width}px`,
              height: `${height}px`,
              transform: 'translate(-50%, -50%)',
              background: getHeatGradient(intensity, isElongated, isVertical),
              mixBlendMode: 'screen', 
              transition: 'all 2s ease-in-out', 
              zIndex: 1
            }} 
          />
        );
      })}
    </div>
  );
}
