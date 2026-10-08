import React, { useState } from 'react';
import { Shelf } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface HeatmapZonePanelProps {
  shelf: Shelf;
  intensity: number; // 0.0 to 1.0
  isSelected: boolean;
  onClick: () => void;
}

export function HeatmapZonePanel({ shelf, intensity, isSelected, onClick }: HeatmapZonePanelProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Generate mock footfall based on intensity for tooltip
  const footfall = Math.floor(intensity * 500) + 20;
  const dwellTime = `0${Math.floor(intensity * 3 + 1)}:${String(Math.floor(intensity * 60)).padStart(2, '0')}`;
  
  const getActivityLabel = (value: number) => {
    if (value <= 0.2) return 'VERY LOW';
    if (value <= 0.4) return 'LOW';
    if (value <= 0.6) return 'MODERATE';
    if (value <= 0.8) return 'HIGH';
    return 'CRITICAL';
  };

  // Base color for tooltip and borders
  const getBaseColor = (value: number) => {
    if (value <= 0.2) return '#1e3a8a'; // Deep blue
    if (value <= 0.4) return '#3b82f6'; // Blue
    if (value <= 0.6) return '#a855f7'; // Purple
    if (value <= 0.8) return '#ef4444'; // Red
    return '#eab308'; // Yellow
  };

  const baseColor = getBaseColor(intensity);

  return (
    <div 
      style={{ position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        onClick={onClick}
        animate={{ 
          scale: isHovered ? 1.05 : 1,
          y: isHovered ? -2 : 0
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '60px',
          border: `1px solid ${isHovered ? baseColor : 'rgba(255,255,255,0.05)'}`,
          borderRadius: '4px',
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          position: 'relative',
          background: 'transparent',
          zIndex: 1, // Above the heat field
          boxShadow: isHovered ? `0 0 15px ${baseColor}40` : 'none',
        }}
      >
        {isSelected && (
          <div style={{
            position: 'absolute',
            inset: -2,
            border: `2px solid ${baseColor}`,
            borderRadius: '6px',
            zIndex: 3,
            pointerEvents: 'none'
          }} />
        )}

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', width: '100%', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>
            {shelf.id.toString().padStart(2, '0')}
          </div>
          {isHovered && (
            <div style={{ fontSize: '10px', color: '#fff', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
              {Math.round(intensity * 100)}%
            </div>
          )}
        </div>
      </motion.button>

      {/* Hover Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${baseColor}`,
              padding: '12px',
              borderRadius: '8px',
              zIndex: 100,
              width: '160px',
              pointerEvents: 'none',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              color: 'white'
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '2px' }}>SHELF {shelf.id.toString().padStart(2, '0')}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>{shelf.category}</div>
            
            <div style={{ 
              fontSize: '10px', 
              fontWeight: 700, 
              color: baseColor, 
              marginBottom: '8px',
              background: `${baseColor}20`,
              padding: '2px 6px',
              borderRadius: '4px',
              display: 'inline-block'
            }}>
              {getActivityLabel(intensity)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Visitors</span>
              <b>{footfall}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Dwell</span>
              <b>{dwellTime}</b>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
