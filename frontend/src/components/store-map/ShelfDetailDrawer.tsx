import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shelf, Camera, ShelfState } from '../../types';
import { Glass } from '../ui/Glass';
import { X, CheckCircle2, Camera as CameraIcon, Cpu, Activity, Package } from 'lucide-react';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { mockAdapterInstance } from '../../adapters/MockIntelligenceAdapter';
import { WebcamShelfPrototype } from './WebcamShelfPrototype';

interface ShelfDetailDrawerProps {
  shelf: Shelf | null;
  camera: Camera | null;
  onClose: () => void;
}

// Derive whether we are running in live mode
const isLiveMode = import.meta.env.VITE_INTELLIGENCE_SOURCE === 'live-test';

// Status → accent color helper
function statusColor(status: ShelfState): string {
  switch (status) {
    case 'NORMAL':       return 'var(--color-green)';
    case 'RESTOCK':      return '#4FC3F7';
    case 'OUT_OF_STOCK': return '#7986FF';
    case 'MISPLACED':    return '#FFA726';
    default:             return 'var(--text-secondary)';
  }
}

export function ShelfDetailDrawer({ shelf, camera, onClose }: ShelfDetailDrawerProps) {
  const { settings } = useAppSettings();
  const [showCam, setShowCam] = useState(false);

  const handleStatusChange = (newStatus: ShelfState) => {
    // In mock mode, update the mock adapter directly.
    // In live mode, the adapter ignores this (read-only from backend).
    if (shelf) mockAdapterInstance.updateShelfStatus(shelf.id, newStatus, shelf.isRectified);
  };

  const handleRectifiedToggle = () => {
    if (shelf) mockAdapterInstance.updateShelfStatus(shelf.id, shelf.status, !shelf.isRectified);
  };

  const accentColor = shelf ? statusColor(shelf.status) : 'var(--color-green)';

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
              {/* ── Header ─────────────────────────────────────────── */}
              <div className="drawer-header">
                <div>
                  <span className="eyebrow">{shelf.zone}</span>
                  <h2>Shelf {String(shelf.id).padStart(2, '0')}</h2>
                </div>
                <button className="close-btn" onClick={onClose}><X size={16} /></button>
              </div>

              <div className="drawer-body">

                {/* ── Live YOLO badge ─────────────────────────────── */}
                {isLiveMode && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 12px', borderRadius: '6px', marginBottom: '8px',
                    background: 'rgba(100,255,160,0.08)',
                    border: '1px solid rgba(100,255,160,0.25)',
                  }}>
                    <Cpu size={12} color="var(--color-green)" />
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-green)', letterSpacing: '0.1em' }}>
                      LIVE YOLO11n INFERENCE
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '9px', color: 'var(--text-tertiary)' }}>
                      Polling every 3s
                    </span>
                  </div>
                )}

                {/* ── Manager controls ────────────────────────────── */}
                {settings.role === 'MANAGER' && (
                  <div className="manager-controls" style={{
                    padding: '16px', background: 'var(--glass-surface-l2)',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)',
                    display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '8px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
                        INVENTORY CONTROL
                      </span>
                      <button
                        onClick={handleRectifiedToggle}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          fontSize: '10px', fontWeight: 600, padding: '4px 8px',
                          borderRadius: '4px',
                          background: shelf.isRectified ? 'rgba(118,239,175,0.15)' : 'var(--glass-surface-l3)',
                          color: shelf.isRectified ? 'var(--color-green)' : 'var(--text-secondary)',
                          border: `1px solid ${shelf.isRectified ? 'rgba(118,239,175,0.3)' : 'var(--glass-border)'}`,
                        }}
                      >
                        {shelf.isRectified && <CheckCircle2 size={12} />}
                        {shelf.isRectified ? 'RECTIFIED' : 'MARK RECTIFIED'}
                      </button>
                    </div>

                    <div className="seg" style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px',
                      background: 'var(--glass-surface-l3)', borderRadius: 'var(--radius-sm)', padding: '4px',
                      opacity: shelf.isRectified ? 0.5 : 1,
                      pointerEvents: shelf.isRectified ? 'none' : 'auto',
                    }}>
                      {(['NORMAL', 'RESTOCK', 'OUT_OF_STOCK', 'MISPLACED'] as ShelfState[]).map(s => (
                        <button
                          key={s}
                          className={shelf.status === s ? 'selected' : ''}
                          onClick={() => handleStatusChange(s)}
                          style={{ fontSize: '9px', padding: '6px 4px' }}
                        >
                          {s.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Status badge ─────────────────────────────────── */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px', borderRadius: '8px', marginBottom: '4px',
                  background: `${accentColor}12`,
                  border: `1px solid ${accentColor}44`,
                }}>
                  <Activity size={18} color={accentColor} />
                  <div>
                    <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>SHELF STATUS</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: accentColor }}>
                      {shelf.status.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>DETECTIONS</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {shelf.detectionCount}
                    </div>
                  </div>
                </div>

                {/* ── Data rows ────────────────────────────────────── */}
                <div className="data-group">
                  <small>PRODUCT</small>
                  <b>{shelf.product}</b>
                </div>

                <div className="data-group">
                  <small>CURRENT STOCK</small>
                  <b>{shelf.stock} units</b>
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

                {/* ── Live Camera Button — available for ALL cameras ── */}
                <div style={{ marginTop: '16px' }}>
                  <button
                    onClick={() => setShowCam(true)}
                    style={{
                      width: '100%', padding: '12px',
                      background: 'rgba(100,200,255,0.08)',
                      border: '1px solid rgba(100,200,255,0.3)',
                      color: '#4FC3F7',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '8px', fontWeight: 600, fontSize: '12px', letterSpacing: '0.05em',
                      cursor: 'pointer',
                    }}
                  >
                    <CameraIcon size={16} />
                    {isLiveMode ? 'LAUNCH LIVE CAMERA VIEW' : 'LAUNCH SHELF CAM PROTOTYPE'}
                  </button>
                </div>

                {/* ── Insight footer ───────────────────────────────── */}
                <div className="drawer-footer">
                  <div className="ai-badge">
                    <span>{isLiveMode ? 'YOLO11n EDGE AI' : 'SIMULATED EDGE AI'}</span>
                  </div>
                  <p>{shelf.insight}</p>
                </div>

              </div>
            </Glass>
          </motion.div>

          {/* ── Full-screen Camera / YOLO Prototype modal ──────────── */}
          <AnimatePresence>
            {showCam && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  position: 'fixed', inset: '24px', zIndex: 1000,
                  background: 'var(--bg-app)', borderRadius: '16px',
                  border: '1px solid var(--glass-border)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{
                  padding: '16px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Cpu size={16} color={isLiveMode ? 'var(--color-green)' : 'var(--text-secondary)'} />
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>
                      {isLiveMode ? 'YOLO11n Live Camera' : 'Camera Prototype'} — Cam {String(camera.id).padStart(2, '0')}
                    </span>
                    {isLiveMode && (
                      <span style={{
                        fontSize: '9px', padding: '2px 8px', borderRadius: '20px',
                        background: 'rgba(100,255,160,0.15)', color: 'var(--color-green)',
                        border: '1px solid rgba(100,255,160,0.3)', fontWeight: 700,
                      }}>LIVE</span>
                    )}
                  </div>
                  <button onClick={() => setShowCam(false)} className="close-btn" style={{ padding: '8px', background: 'var(--glass-surface-l2)', borderRadius: '50%' }}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                  <WebcamShelfPrototype
                    cameraId={camera.id}
                    shelf={shelf}
                    onClose={() => setShowCam(false)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
