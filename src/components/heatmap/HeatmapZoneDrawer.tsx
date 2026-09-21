import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Glass } from '../ui/Glass';
import { X, Activity, Users, Clock, Camera } from 'lucide-react';
import { Shelf } from '../../types';

interface HeatmapZoneDrawerProps {
  shelf: Shelf | null;
  intensity: number;
  onClose: () => void;
}

export function HeatmapZoneDrawer({ shelf, intensity, onClose }: HeatmapZoneDrawerProps) {
  if (!shelf) return null;

  // Derive mock traffic stats from intensity
  const footfall = Math.floor(intensity * 500) + 20;
  const dwellTime = `0${Math.floor(intensity * 3 + 1)}:${String(Math.floor(intensity * 60)).padStart(2, '0')}`;
  
  const getActivityLabel = (value: number) => {
    if (value <= 0.2) return 'VERY LOW';
    if (value <= 0.4) return 'LOW';
    if (value <= 0.6) return 'MODERATE';
    if (value <= 0.8) return 'HIGH';
    return 'CRITICAL';
  };

  const getColorFromIntensity = (value: number) => {
    if (value <= 0.2) return '#1e3a8a';
    if (value <= 0.4) return '#3b82f6';
    if (value <= 0.6) return 'var(--color-green)';
    if (value <= 0.8) return 'var(--color-orange)';
    return 'var(--color-red)';
  };

  const color = getColorFromIntensity(intensity);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '450px',
          maxWidth: '100vw',
          zIndex: 100,
          padding: '24px'
        }}
      >
        <Glass style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Header */}
          <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border-highlight)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>ZONE INTELLIGENCE</span>
              <h2 style={{ fontSize: '20px', margin: '0 0 4px 0' }}>SHELF {shelf.id.toString().padStart(2, '0')}</h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{shelf.category}</div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Heat Intensity */}
            <div style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: `1px solid ${color}40`, 
              borderRadius: '8px', 
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: `inset 0 0 20px ${color}20`
            }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>CURRENT INTENSITY</div>
                <div style={{ fontSize: '24px', fontWeight: 600, color: color }}>
                  {getActivityLabel(intensity)}
                </div>
              </div>
              <Activity size={32} color={color} opacity={0.8} />
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  <Users size={14} className="text-cyan" />
                  <span style={{ fontSize: '11px', textTransform: 'uppercase' }}>Footfall</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 300 }}>{footfall}</div>
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  <Clock size={14} className="text-purple" />
                  <span style={{ fontSize: '11px', textTransform: 'uppercase' }}>Avg Dwell</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 300 }}>{dwellTime}</div>
              </div>
            </div>

            {/* Source Reference */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--glass-border)' }}>
              <Camera size={14} className="text-tertiary" />
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Data Source</div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>Camera {shelf.cameraId.toString().padStart(2, '0')}</div>
              </div>
            </div>

          </div>
        </Glass>
      </motion.div>
    </AnimatePresence>
  );
}
