import React, { useRef, useEffect } from 'react';

export type RoiPoint = { x: number; y: number };

interface RoiPolygonEditorProps {
  points: RoiPoint[];
  locked: boolean;
  color: string;
  onChange: (points: RoiPoint[]) => void;
  onCommit: (points: RoiPoint[]) => void;
  onDragStart: () => void;
}

export function RoiPolygonEditor({ points, locked, color, onChange, onCommit, onDragStart }: RoiPolygonEditorProps) {
  const draggingIdxRef = useRef<number | null>(null);
  const containerRef = useRef<SVGSVGElement>(null);
  const currentPointsRef = useRef<RoiPoint[]>(points);

  useEffect(() => {
    currentPointsRef.current = points;
  }, [points]);

  const handlePointerDown = (e: React.PointerEvent<SVGCircleElement>, idx: number) => {
    if (locked) return;
    draggingIdxRef.current = idx;
    e.currentTarget.setPointerCapture(e.pointerId);
    onDragStart();
    e.stopPropagation();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingIdxRef.current === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    const newPoints = [...currentPointsRef.current];
    newPoints[draggingIdxRef.current] = { x, y };
    currentPointsRef.current = newPoints;
    onChange(newPoints);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGCircleElement>) => {
    if (draggingIdxRef.current !== null) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      draggingIdxRef.current = null;
      onCommit(currentPointsRef.current);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<SVGCircleElement>) => {
    if (draggingIdxRef.current !== null) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      draggingIdxRef.current = null;
      onCommit(currentPointsRef.current);
    }
  };

  return (
    <svg 
      ref={containerRef} 
      className="absolute top-0 left-0 w-full h-full z-10" 
      style={{ touchAction: 'none' }}
      onPointerMove={handlePointerMove}
    >
      <polygon 
        points={points.map(p => `${p.x * 100}% ${p.y * 100}%`).join(', ')} 
        fill={color} 
        fillOpacity="0.15"
        stroke={color} 
        strokeWidth="2" 
        pointerEvents="none" 
      />
      {!locked && points.map((p, i) => (
        <circle 
          key={i} 
          cx={`${p.x * 100}%`} 
          cy={`${p.y * 100}%`} 
          r="8" 
          fill="white" 
          stroke={color} 
          strokeWidth="2"
          onPointerDown={(e) => handlePointerDown(e, i)}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="cursor-pointer hover:fill-blue-400"
          style={{ pointerEvents: 'auto' }}
        />
      ))}
    </svg>
  );
}
