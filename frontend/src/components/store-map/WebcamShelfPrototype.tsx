import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Shelf } from '../../types';
import { Cpu, RefreshCw, AlertTriangle, CheckCircle, Package } from 'lucide-react';

interface WebcamShelfPrototypeProps {
  cameraId: number;
  shelf: Shelf | null;
  onClose: () => void;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5000';
const IS_LIVE  = import.meta.env.VITE_INTELLIGENCE_SOURCE === 'live-test';

interface ShelfStatusData {
  shelf_id:           string;
  bottle_count:       number;
  stock_status:       string;
  misplaced_objects:  string[];
  average_confidence: number;
  timestamp:          string;
}

function statusToColor(status: string) {
  switch (status) {
    case 'AVAILABLE':    return '#76EFAF';
    case 'OUT_OF_STOCK': return '#7986FF';
    case 'NORMAL':       return '#76EFAF';
    case 'RESTOCK':      return '#4FC3F7';
    case 'MISPLACED':    return '#FFA726';
    default:             return '#888';
  }
}

export function WebcamShelfPrototype({ cameraId, shelf, onClose }: WebcamShelfPrototypeProps) {
  const videoRef          = useRef<HTMLVideoElement>(null);
  const [camError,   setCamError]   = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<ShelfStatusData | null>(null);
  const [pollError,  setPollError]  = useState<string | null>(null);
  const [lastPoll,   setLastPoll]   = useState<string>('Never');

  // ── Webcam feed ───────────────────────────────────────────────────────────
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCam() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCamError('Camera API not supported in this browser.');
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err: any) {
        const msg = err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser.'
          : err.name === 'NotFoundError'
          ? 'No camera found. Plug in a webcam to see the live feed.'
          : `Camera error: ${err.message ?? err.name}`;
        setCamError(msg);
      }
    }

    startCam();
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  // ── Poll /api/shelf-status every 3s for YOLO inference results ────────────
  const pollShelfStatus = useCallback(async () => {
    if (!IS_LIVE) return;
    try {
      const res = await fetch(`${BASE_URL}/api/shelf-status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.available && json.data) {
        const d = json.data;
        setLiveStatus({
          shelf_id:           d.shelf_id ?? 'SHELF_01',
          bottle_count:       d.bottle_count ?? 0,
          stock_status:       d.stock_status ?? 'UNKNOWN',
          misplaced_objects:  Array.isArray(d.misplaced_objects) ? d.misplaced_objects : [],
          average_confidence: d.average_confidence ?? 0,
          timestamp:          d.timestamp ?? '',
        });
        setPollError(null);
      } else {
        setPollError('No detection data yet. Start the YOLO worker.');
      }
      setLastPoll(new Date().toLocaleTimeString());
    } catch (e: any) {
      setPollError(`Backend offline: ${e.message}`);
    }
  }, []);

  useEffect(() => {
    if (!IS_LIVE) return;
    pollShelfStatus();
    const id = setInterval(pollShelfStatus, 3000);
    return () => clearInterval(id);
  }, [pollShelfStatus]);

  // ── Render ────────────────────────────────────────────────────────────────
  const confPct = liveStatus ? (liveStatus.average_confidence * 100).toFixed(1) : '--';
  const color   = liveStatus ? statusToColor(liveStatus.stock_status) : '#888';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Cpu size={18} color={IS_LIVE ? '#76EFAF' : 'var(--text-secondary)'} />
        <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '15px' }}>
          {IS_LIVE ? 'YOLO11n Live Feed' : 'Webcam Prototype'} — Cam {String(cameraId).padStart(2, '0')}
        </h3>
        {IS_LIVE && (
          <span style={{
            fontSize: '9px', padding: '2px 8px', borderRadius: '20px',
            background: 'rgba(118,239,175,0.15)', color: '#76EFAF',
            border: '1px solid rgba(118,239,175,0.3)', fontWeight: 700, marginLeft: 'auto',
          }}>
            LIVE
          </span>
        )}
      </div>

      {/* Video + overlay */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: '900px', aspectRatio: '16/9',
        background: '#000', borderRadius: '10px', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${color}44`,
        alignSelf: 'center',
      }}>
        {camError ? (
          <div style={{ textAlign: 'center', padding: '24px', maxWidth: '380px' }}>
            <AlertTriangle size={32} color="#FFA726" style={{ marginBottom: '12px' }} />
            <p style={{ color: '#FFA726', fontWeight: 700, marginBottom: '8px' }}>{camError}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              The YOLO worker window (yolo_roi.py / worker.py) renders detections directly on the camera frame. 
              Allow browser camera access here for a local preview.
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Live status overlay — top-left */}
            {IS_LIVE && liveStatus && (
              <div style={{
                position: 'absolute', top: '12px', left: '12px',
                background: 'rgba(15,18,25,0.85)',
                borderRadius: '8px', padding: '10px 14px',
                border: `1px solid ${color}55`,
                minWidth: '160px',
              }}>
                <div style={{ fontSize: '8px', color: '#888', letterSpacing: '0.12em', marginBottom: '4px' }}>YOLO11n STATUS</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color, letterSpacing: '0.04em' }}>
                  {liveStatus.stock_status}
                </div>
                <div style={{ fontSize: '11px', color: '#ccc', marginTop: '4px' }}>
                  Bottles: <strong>{liveStatus.bottle_count}</strong>
                </div>
                <div style={{ fontSize: '11px', color: '#ccc' }}>
                  Conf: <strong>{confPct}%</strong>
                </div>
              </div>
            )}

            {/* ROI indicator — center */}
            <div style={{
              position: 'absolute',
              top: '15%', left: '20%', right: '20%', bottom: '15%',
              border: `2px solid ${color}`,
              opacity: 0.5, pointerEvents: 'none',
              borderRadius: '4px',
            }}>
              <span style={{
                position: 'absolute', top: '-22px', left: '0',
                color, fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
              }}>
                SHELF ROI
              </span>
            </div>

            {/* Misplaced objects — bottom-left */}
            {IS_LIVE && liveStatus && liveStatus.misplaced_objects.length > 0 && (
              <div style={{
                position: 'absolute', bottom: '12px', left: '12px',
                background: 'rgba(255,100,50,0.15)',
                border: '1px solid rgba(255,100,50,0.4)',
                borderRadius: '6px', padding: '8px 12px',
              }}>
                <div style={{ fontSize: '9px', color: '#FFA726', fontWeight: 700, marginBottom: '4px' }}>MISPLACED OBJECTS</div>
                {liveStatus.misplaced_objects.map((o, i) => (
                  <div key={i} style={{ fontSize: '11px', color: '#FFA726' }}>⚠ {o}</div>
                ))}
              </div>
            )}

            {/* Poll error indicator */}
            {IS_LIVE && pollError && (
              <div style={{
                position: 'absolute', bottom: '12px', right: '12px',
                background: 'rgba(255,80,80,0.15)',
                border: '1px solid rgba(255,80,80,0.3)',
                borderRadius: '6px', padding: '8px 12px', maxWidth: '260px',
              }}>
                <div style={{ fontSize: '9px', color: '#FF6B6B', fontWeight: 700 }}>BACKEND STATUS</div>
                <div style={{ fontSize: '10px', color: '#FF6B6B', marginTop: '2px' }}>{pollError}</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {/* Bottles */}
        <StatCard
          icon={<Package size={14} />}
          label="BOTTLES DETECTED"
          value={IS_LIVE && liveStatus ? String(liveStatus.bottle_count) : (shelf?.detectionCount ?? '--').toString()}
          color={color}
        />
        {/* Status */}
        <StatCard
          icon={<CheckCircle size={14} />}
          label="STOCK STATUS"
          value={IS_LIVE && liveStatus ? liveStatus.stock_status : (shelf?.status ?? 'UNKNOWN').replace(/_/g, ' ')}
          color={color}
        />
        {/* Confidence */}
        <StatCard
          icon={<Cpu size={14} />}
          label="AVG CONFIDENCE"
          value={IS_LIVE && liveStatus ? `${confPct}%` : shelf?.lastAnalysis?.split('Conf ')[1]?.split('%')[0] ? `${shelf.lastAnalysis.split('Conf ')[1].split('%')[0]}%` : '--'}
          color="#4FC3F7"
        />
        {/* Last update */}
        <StatCard
          icon={<RefreshCw size={14} />}
          label="LAST POLL"
          value={IS_LIVE ? lastPoll : 'Mock mode'}
          color="var(--text-secondary)"
        />
      </div>

      {/* Insight / instructions */}
      <div style={{
        padding: '12px 16px', borderRadius: '8px',
        background: 'var(--glass-surface-l2)', border: '1px solid var(--glass-border)',
        fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6,
      }}>
        {IS_LIVE ? (
          <>
            <strong style={{ color: 'var(--text-primary)' }}>Live integration:</strong>{' '}
            The YOLO detection values above come from{' '}
            <code style={{ color: '#4FC3F7' }}>GET /api/shelf-status</code> which is updated every{' '}
            <code style={{ color: '#4FC3F7' }}>DB_SAVE_INTERVAL</code> seconds by the YOLO worker
            (default 5 s). Start <code>worker.py</code> in the backend folder to populate live data.
            To use an MP4 instead of a webcam, set <code>YOLO_SOURCE=C:\path\to\video.mp4</code>
            in the backend <code>.env</code> file.
          </>
        ) : (
          <>
            <strong style={{ color: 'var(--text-primary)' }}>Mock mode active.</strong>{' '}
            Set <code>VITE_INTELLIGENCE_SOURCE=live-test</code> and start the Flask backend + YOLO worker
            to see real inference data here.
          </>
        )}
      </div>

    </div>
  );
}

// ── Tiny stat card ────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) {
  return (
    <div style={{
      padding: '12px', borderRadius: '8px',
      background: 'var(--glass-surface-l2)', border: '1px solid var(--glass-border)',
      display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)' }}>
        {icon}
        <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '18px', fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
