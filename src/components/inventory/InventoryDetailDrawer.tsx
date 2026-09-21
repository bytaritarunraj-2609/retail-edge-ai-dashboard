import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shelf, Camera } from '../../types';
import { Glass } from '../ui/Glass';
import { X, CheckCircle, Activity, Camera as CameraIcon, Info, RefreshCw } from 'lucide-react';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { mockAdapterInstance } from '../../adapters/MockIntelligenceAdapter';

interface InventoryDetailDrawerProps {
  shelf: Shelf | null;
  camera: Camera | null;
  onClose: () => void;
}

export function InventoryDetailDrawer({ shelf, camera, onClose }: InventoryDetailDrawerProps) {
  const { settings } = useAppSettings();

  if (!shelf) return null;

  const handleRectify = () => {
    mockAdapterInstance.updateShelfStatus(shelf.id, 'NORMAL', true);
    onClose();
  };

  const getStatusColor = (s: string) => {
    if (s === 'NORMAL') return 'var(--color-green)';
    if (s === 'RESTOCK') return 'var(--color-orange)';
    if (s === 'OUT_OF_STOCK') return 'var(--color-red)';
    if (s === 'MISPLACED') return 'var(--color-purple)';
    return 'var(--text-primary)';
  };

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
          width: '400px',
          maxWidth: '100vw',
          zIndex: 100,
          padding: '24px'
        }}
      >
        <Glass style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border-highlight)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="eyebrow">{shelf.category}</span>
              <h2 style={{ fontSize: '24px', margin: '4px 0 8px 0' }}>{shelf.product}</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ 
                  padding: '4px 8px', 
                  fontSize: '10px', 
                  fontWeight: 700, 
                  backgroundColor: `${getStatusColor(shelf.status)}20`,
                  color: getStatusColor(shelf.status),
                  borderRadius: '4px'
                }}>
                  {shelf.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Glass style={{ padding: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '8px' }}>CURRENT STOCK</span>
                <div style={{ fontSize: '24px', fontWeight: 300, display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  {shelf.stock} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>/ {shelf.capacity}</span>
                </div>
              </Glass>
              <Glass style={{ padding: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '8px' }}>ACTIVITY</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} className={shelf.activityLevel === 'HIGH' ? 'text-red' : shelf.activityLevel === 'MEDIUM' ? 'text-orange' : 'text-green'} />
                  <span style={{ fontSize: '16px', fontWeight: 500 }}>{shelf.activityLevel}</span>
                </div>
              </Glass>
            </div>

            <div>
              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.05em' }}>Location & Telemetry</h4>
              <Glass style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Shelf ID</span>
                  <span>{String(shelf.id).padStart(2, '0')} · {shelf.zone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Camera</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CameraIcon size={12} /> CAM {String(shelf.cameraId).padStart(2, '0')}
                    <span style={{ color: 'var(--color-cyan)', fontSize: '10px', marginLeft: '4px' }}>({camera?.state || 'INACTIVE'})</span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Last Scan</span>
                  <span>{shelf.lastScan}</span>
                </div>
              </Glass>
            </div>

            <div>
              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.05em' }}>AI Intelligence</h4>
              <Glass style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '2px solid var(--color-purple)' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Info size={16} className="text-purple" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '13px', lineHeight: '1.5' }}>{shelf.insight}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                      {shelf.detectionCount} detections · {shelf.trackCount} tracks today
                    </div>
                  </div>
                </div>
              </Glass>
            </div>

          </div>

          <div style={{ padding: '24px', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
            {settings.role === 'MANAGER' ? (
              shelf.status !== 'NORMAL' ? (
                <button 
                  className="glass" 
                  onClick={handleRectify}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '8px',
                    background: 'var(--color-green)',
                    color: '#000',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <CheckCircle size={16} />
                  MARK RESOLVED
                </button>
              ) : (
                <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-tertiary)', padding: '12px' }}>
                  Stock status is optimal. No action required.
                </div>
              )
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <RefreshCw size={14} className="text-tertiary" />
                Managers can resolve inventory issues.
              </div>
            )}
          </div>
        </Glass>
      </motion.div>
    </AnimatePresence>
  );
}
