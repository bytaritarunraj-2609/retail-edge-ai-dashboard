import React, { useRef, useEffect, useState } from 'react';
import { RoiPolygonEditor, RoiPoint } from './RoiPolygonEditor';

interface CameraViewportProps {
  streamUrl: string;
  frameWidth: number;
  frameHeight: number;
  points: RoiPoint[];
  locked: boolean;
  color: string;
  onChange: (points: RoiPoint[]) => void;
  onCommit: (points: RoiPoint[]) => void;
  onDragStart: () => void;
}

export function CameraViewport({ 
  streamUrl, frameWidth, frameHeight, points, locked, color, onChange, onCommit, onDragStart 
}: CameraViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: availableWidth, height: availableHeight } = entry.contentRect;
        if (availableWidth === 0 || availableHeight === 0) continue;
        
        const fw = frameWidth || 640;
        const fh = frameHeight || 480;
        
        const scale = Math.min(availableWidth / fw, availableHeight / fh);
        setDimensions({ width: fw * scale, height: fh * scale });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [frameWidth, frameHeight]);

  return (
    <div ref={containerRef} className="flex-grow mb-4 bg-black rounded flex items-center justify-center relative overflow-hidden">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <div style={{ width: dimensions.width, height: dimensions.height, position: 'relative' }}>
          <img 
            src={streamUrl} 
            className="absolute top-0 left-0 w-full h-full pointer-events-none object-fill" 
            alt="Live Stream" 
          />
          <RoiPolygonEditor 
            points={points} 
            locked={locked} 
            color={color} 
            onChange={onChange} 
            onCommit={onCommit} 
            onDragStart={onDragStart} 
          />
        </div>
      )}
    </div>
  );
}
