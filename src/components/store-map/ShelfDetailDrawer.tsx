import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shelf, Camera, ShelfState } from '../../types';
import { Glass } from '../ui/Glass';
import { X, CheckCircle2 } from 'lucide-react';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { mockAdapterInstance } from '../../adapters/MockIntelligenceAdapter';

interface ShelfDetailDrawerProps {
  shelf: Shelf | null;
  camera: Camera | null;
  onClose: () => void;
}

export function ShelfDetailDrawer({ shelf, camera, onClose }: ShelfDetailDrawerProps) {
  const { settings } = useAppSettings();

  const handleStatusChange = (newStatus: ShelfState) => {
    if (shelf) mockAdapterInstance.updateShelfStatus(shelf.id, newStatus, shelf.isRectified);
  };

  const handleRectifiedToggle = () => {
    if (shelf) mockAdapterInstance.updateShelfStatus(shelf.id, shelf.status, !shelf.isRectified);
  };

  return (
    <AnimatePresence>
      {shelf && camera && (
        <motion.div
          className="shelf-detail-drawer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            className="shelf-detail-drawer"
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={e => e.stopPropagation()}
          >
            <Glass className="drawer-glass">
              <div className="drawer-header">
                <div>
                  <span className="eyebrow">{shelf.zone}</span>
                  <h2>Shelf {String(shelf.id).padStart(2, '0')}</h2>
                </div>
                <button className="close-btn" onClick={onClose}><X size={16} /></button>
              </div>

              <div className="drawer-body">
                {settings.role === 'MANAGER' && (
                  <div className="manager-controls" style={{ padding: '16px', background: 'var(--glass-surface-l2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>INVENTORY CONTROL</span>
                      
                      <button 
                        onClick={handleRectifiedToggle}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 600, padding: '4px 8px', borderRadius: '4px', background: shelf.isRectified ? 'rgba(118,239,175,0.15)' : 'var(--glass-surface-l3)', color: shelf.isRectified ? 'var(--color-green)' : 'var(--text-secondary)', border: `1px solid ${shelf.isRectified ? 'rgba(118,239,175,0.3)' : 'var(--glass-border)'}` }}
                      >
                        {shelf.isRectified && <CheckCircle2 size={12} />}
                        {shelf.isRectified ? 'RECTIFIED' : 'MARK RECTIFIED'}
                      </button>
                    </div>

                    <div className="seg" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', background: 'var(--glass-surface-l3)', borderRadius: 'var(--radius-sm)', padding: '4px', opacity: shelf.isRectified ? 0.5 : 1, pointerEvents: shelf.isRectified ? 'none' : 'auto' }}>
                      <button className={shelf.status === 'NORMAL' ? 'selected' : ''} onClick={() => handleStatusChange('NORMAL')} style={{ fontSize: '9px', padding: '6px 4px' }}>NORMAL</button>
                      <button className={shelf.status === 'RESTOCK' ? 'selected' : ''} onClick={() => handleStatusChange('RESTOCK')} style={{ fontSize: '9px', padding: '6px 4px' }}>RESTOCK</button>
                      <button className={shelf.status === 'OUT_OF_STOCK' ? 'selected' : ''} onClick={() => handleStatusChange('OUT_OF_STOCK')} style={{ fontSize: '9px', padding: '6px 4px' }}>OUT OF STOCK</button>
                      <button className={shelf.status === 'MISPLACED' ? 'selected' : ''} onClick={() => handleStatusChange('MISPLACED')} style={{ fontSize: '9px', padding: '6px 4px' }}>MISPLACED</button>
                    </div>
                  </div>
                )}

                <div className="data-group">
                  <small>PRODUCT</small>
                  <b>{shelf.product}</b>
                </div>

                <div className="data-group">
                  <small>CURRENT STOCK</small>
                  <b>{shelf.stock} units</b>
                </div>

                <div className="data-group">
                  <small>SHELF STATUS</small>
                  <span className={`status-badge ${shelf.status.toLowerCase()}`}>
                    {shelf.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="data-group">
                  <small>CAMERA STATUS</small>
                  <span className={`cam-status ${camera.state.toLowerCase()}`}>
                    <i className="cam-led" />
                    {camera.state}
                  </span>
                </div>

                <div className="data-group">
                  <small>ACTIVITY LEVEL</small>
                  <b>{shelf.activityLevel}</b>
                </div>

                <div className="data-group">
                  <small>LAST SCAN</small>
                  <b>{shelf.lastScan}</b>
                </div>

                <div className="data-group">
                  <small>LAST ANALYSIS</small>
                  <p className="insight-text">{shelf.lastAnalysis}</p>
                </div>

                <div className="data-row">
                  <div className="data-group">
                    <small>DETECTIONS</small>
                    <b>{shelf.detectionCount}</b>
                  </div>
                  <div className="data-group">
                    <small>TRACKS</small>
                    <b>{shelf.trackCount}</b>
                  </div>
                </div>

                <div className="drawer-footer">
                  <div className="ai-badge">
                    <span>SIMULATED EDGE AI</span>
                  </div>
                  <p>{shelf.insight}</p>
                </div>
              </div>
            </Glass>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
