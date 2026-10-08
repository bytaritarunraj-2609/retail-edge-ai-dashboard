import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Maximize2, Minimize2, X, Lock, Unlock, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { RETAIL_PRODUCT_CLASSES, SHELF_CONFIGS } from '../../data/shelfObjectConfig';

interface Point {
  x: number;
  y: number;
}

interface Detection {
  classId: number;
  className: string;
  confidence: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface FilteredDetection extends Detection {
  inRoi: boolean;
  status: 'REGISTERED' | 'MISPLACED' | 'IGNORE';
}

interface AIResponse {
  detections: Detection[];
  frameWidth: number;
  frameHeight: number;
  inferenceFps: number;
}

interface WebcamShelfPrototypeProps {
  cameraId?: number;
  onClose: () => void;
}

type ConnectionState = 'CONNECTING' | 'LIVE' | 'OFFLINE' | 'ERROR';

const DEFAULT_ROI: Point[] = [
  { x: 0.15, y: 0.15 }, // TL
  { x: 0.85, y: 0.15 }, // TR
  { x: 0.85, y: 0.85 }, // BR
  { x: 0.15, y: 0.85 }  // BL
];

// Ray-casting algorithm for Point in Polygon
function pointInPolygon(point: Point, vs: Point[]) {
  let x = point.x, y = point.y;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i].x, yi = vs[i].y;
    let xj = vs[j].x, yj = vs[j].y;
    let intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function WebcamShelfPrototype({ cameraId = 3, onClose }: WebcamShelfPrototypeProps) {
  const { settings } = useAppSettings();
  const isManager = settings.role === 'MANAGER';
  
  const shelfConfig = SHELF_CONFIGS[cameraId] || { registeredObjects: [] };

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [connState, setConnState] = useState<ConnectionState>('CONNECTING');
  const [retryCount, setRetryCount] = useState(0);

  const [frameSize, setFrameSize] = useState({ width: 640, height: 480 });
  const [streamFps, setStreamFps] = useState(0);
  const [inferenceFps, setInferenceFps] = useState(0);

  const [viewMode, setViewMode] = useState<'normal' | 'expanded' | 'fullscreen'>('expanded');
  const [showDebug, setShowDebug] = useState(false);

  const [detections, setDetections] = useState<FilteredDetection[]>([]);
  const activeMisplaced = useMemo(() => detections.filter(d => d.inRoi && d.status === 'MISPLACED'), [detections]);

  const roiState = useMemo(() => {
    const misplaced = detections.filter(d => d.inRoi && d.status === 'MISPLACED').length;
    const registered = detections.filter(d => d.inRoi && d.status === 'REGISTERED').length;
    if (misplaced > 0) return 'ORANGE';
    if (registered > 0) return 'GREEN';
    return 'RED';
  }, [detections]);

  const getRoiColors = () => {
    switch (roiState) {
      case 'GREEN': return { fill: 'rgba(118,239,175,0.15)', stroke: 'rgba(118,239,175,1.0)', glow: 'rgba(118,239,175,0.8)' };
      case 'ORANGE': return { fill: 'rgba(255,159,67,0.15)', stroke: 'rgba(255,159,67,1.0)', glow: 'rgba(255,159,67,0.8)' };
      case 'RED': return { fill: 'rgba(255,77,79,0.15)', stroke: 'rgba(255,77,79,1.0)', glow: 'rgba(255,77,79,0.8)' };
      default: return { fill: 'rgba(255,255,255,0.1)', stroke: 'rgba(255,255,255,1.0)', glow: 'rgba(255,255,255,0.5)' };
    }
  };
  const roiColors = getRoiColors();

  // ROI State
  const [isLocked, setIsLocked] = useState(true);
  const [roi, setRoi] = useState<Point[]>(() => {
    const saved = localStorage.getItem(`camera_roi_${cameraId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_ROI; }
    }
    return DEFAULT_ROI;
  });
  const [dragState, setDragState] = useState<{ pointIndex: number; } | null>(null);

  // Layout Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  const saveRoi = (newRoi: Point[]) => {
    setRoi(newRoi);
    localStorage.setItem(`camera_roi_${cameraId}`, JSON.stringify(newRoi));
  };

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isComponentMounted = true;

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
        });
        
        if (!isComponentMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();
            setFrameSize({
              width: settings.width || videoRef.current!.videoWidth || 640,
              height: settings.height || videoRef.current!.videoHeight || 480
            });
            setStreamActive(true);
            setCameraError(null);
          };
        }
      } catch (err) {
        console.error("Camera access failed", err);
        if (isComponentMounted) {
          setCameraError("Camera access denied or unavailable");
          setConnState('ERROR');
        }
      }
    }

    initCamera();

    return () => {
      isComponentMounted = false;
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const currentRoi = useRef(roi);
  const currentConfig = useRef(shelfConfig);
  
  useEffect(() => { currentRoi.current = roi; }, [roi]);
  useEffect(() => { currentConfig.current = shelfConfig; }, [shelfConfig]);

  useEffect(() => {
    if (!streamActive) return;
    
    let isComponentMounted = true;
    let frameCount = 0;
    let lastFpsTime = Date.now();

    function connectWs(currentRetry: number) {
      if (!isComponentMounted) return;
      setConnState('CONNECTING');
      
      const ws = new WebSocket('ws://localhost:8000/ws/shelf');
      
      ws.onopen = () => {
        if (!isComponentMounted) return;
        wsRef.current = ws;
        setConnState('LIVE');
        setRetryCount(0);
      };

      ws.onmessage = (event) => {
        try {
          const data: AIResponse = JSON.parse(event.data);
          
          if (data.frameWidth && data.frameHeight) {
            setFrameSize({ width: data.frameWidth, height: data.frameHeight });
          }
          if (data.inferenceFps) {
            setInferenceFps(data.inferenceFps);
          }
          if (data.detections) {
            const fWidth = data.frameWidth || 640;
            const fHeight = data.frameHeight || 480;
            const currentPoly = currentRoi.current;
            const config = currentConfig.current;

            const filtered: FilteredDetection[] = data.detections.map(det => {
              const centerX = (det.x1 + det.x2) / 2;
              const centerY = (det.y1 + det.y2) / 2;
              const normX = centerX / fWidth;
              const normY = centerY / fHeight;
              const inside = pointInPolygon({ x: normX, y: normY }, currentPoly);
              
              let status: 'REGISTERED' | 'MISPLACED' | 'IGNORE' = 'IGNORE';
              
              const className = det.className.toLowerCase();
              if (RETAIL_PRODUCT_CLASSES.includes(className)) {
                if (config.registeredObjects.includes(className)) {
                  status = 'REGISTERED';
                } else {
                  status = 'MISPLACED';
                }
              }

              return { ...det, inRoi: inside, status };
            });

            setDetections(filtered);
          }
          
          frameCount++;
          const now = Date.now();
          if (now - lastFpsTime >= 1000) {
            setStreamFps(frameCount);
            frameCount = 0;
            lastFpsTime = now;
          }
        } catch (e) {
          console.error("Failed to parse WS message", e);
        } finally {
          isProcessing = false;
          if (isComponentMounted) requestAnimationFrame(sendFrame);
        }
      };

      ws.onerror = () => { if (wsRef.current?.readyState !== WebSocket.CLOSED) setConnState('ERROR'); };

      ws.onclose = () => {
        wsRef.current = null;
        if (isComponentMounted) {
          setConnState('OFFLINE');
          const backoff = Math.min(1000 * Math.pow(2, currentRetry), 10000);
          setRetryCount(currentRetry + 1);
          reconnectTimeoutRef.current = setTimeout(() => connectWs(currentRetry + 1), backoff);
        }
      };
    }

    let isProcessing = false;

    function sendFrame() {
      if (!isComponentMounted) return;
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !videoRef.current || !canvasRef.current || videoRef.current.videoWidth === 0) {
        isProcessing = false;
        requestAnimationFrame(sendFrame);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        isProcessing = false;
        requestAnimationFrame(sendFrame);
        return;
      }

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      wsRef.current.send(JSON.stringify({ image: dataUrl }));
    }

    connectWs(retryCount);
    const kickOffTimer = setTimeout(() => sendFrame(), 500);

    return () => {
      isComponentMounted = false;
      clearTimeout(kickOffTimer);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [streamActive]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    if (isLocked || !isManager) return;
    e.stopPropagation();
    setDragState({ pointIndex: index });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isLocked || !isManager || !dragState || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const newRoi = [...roi];
    newRoi[dragState.pointIndex] = { x: nx, y: ny };
    saveRoi(newRoi);
  };

  const handlePointerUp = () => setDragState(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewMode === 'fullscreen') setViewMode('expanded');
      if (e.key === 'd' || e.key === 'D') setShowDebug(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  let width = '480px';
  let height = 'auto';
  if (viewMode === 'expanded') width = '1000px'; // Wider to accommodate side panel
  else if (viewMode === 'fullscreen') { width = '100vw'; height = '100vh'; }

  const polyPointsString = useMemo(() => {
    return roi.map(p => `${p.x * containerSize.w},${p.y * containerSize.h}`).join(" ");
  }, [roi, containerSize]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      style={{
        position: viewMode === 'fullscreen' ? 'fixed' : 'absolute',
        bottom: viewMode === 'fullscreen' ? 0 : '16px',
        right: viewMode === 'fullscreen' ? 0 : '24px',
        width,
        height,
        background: 'rgba(10,12,16,0.95)',
        backdropFilter: 'blur(24px)',
        border: viewMode === 'fullscreen' ? 'none' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: viewMode === 'fullscreen' ? 0 : '12px',
        boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* HEADER */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#76EFAF', boxShadow: '0 0 10px rgba(118,239,175,0.5)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff', letterSpacing: '0.05em' }}>CAMERA {String(cameraId).padStart(2, '0')}</span>
          </div>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>EDGE AI PROTOTYPE</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setViewMode(viewMode === 'fullscreen' ? 'expanded' : 'fullscreen')} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer', padding: 4 }}>
            {viewMode === 'fullscreen' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer', padding: 4 }}><X size={16} /></button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: viewMode === 'normal' ? '320px' : viewMode === 'expanded' ? '450px' : 'auto' }}>
        {/* VIDEO AREA */}
        <div 
          style={{ flex: 1, position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}
        >
          <div ref={containerRef} style={{ position: 'relative', aspectRatio: `${frameSize.width} / ${frameSize.height}`, maxHeight: '100%', maxWidth: '100%', width: '100%' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {cameraError && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', zIndex: 20 }}>
                <div style={{ color: '#ff4d4f', fontWeight: 600, padding: '16px 32px', border: '1px solid #ff4d4f', borderRadius: '4px', background: 'rgba(255,77,79,0.1)' }}>{cameraError}</div>
              </div>
            )}

            {!cameraError && containerSize.w > 0 && (
              <>
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5, transition: 'all 0.3s ease-in-out' }}>
                  <polygon points={polyPointsString} fill={roiColors.fill} stroke={roiColors.stroke} strokeLinejoin="round" strokeWidth={dragState ? "3" : "2"} strokeDasharray={isLocked ? "4 4" : "0"} style={{ filter: `drop-shadow(0 0 8px ${roiColors.glow})`, transition: 'all 0.3s ease-in-out' }} />
                </svg>

                {!isLocked && isManager && roi.map((p, i) => (
                  <div key={i} onPointerDown={(e) => handlePointerDown(e, i)}
                    style={{ position: 'absolute', width: '32px', height: '32px', left: `${p.x * 100}%`, top: `${p.y * 100}%`, transform: 'translate(-50%, -50%)', cursor: 'crosshair', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: dragState?.pointIndex === i ? '16px' : '12px', height: dragState?.pointIndex === i ? '16px' : '12px', backgroundColor: roiColors.stroke, border: '2px solid #000', borderRadius: '50%', boxShadow: `0 0 10px ${roiColors.glow}`, transition: 'all 0.1s ease-out' }} />
                      <div style={{ position: 'absolute', top: -20, right: -12, fontSize: '10px', color: roiColors.stroke, fontWeight: 700, textShadow: '0 1px 2px #000', fontFamily: 'monospace' }}>P{i+1}</div>
                    </div>
                  </div>
                ))}

                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 6 }}>
                  {connState === 'LIVE' && detections.map((det, i) => {
                    // Logic for displaying detections
                    if (!det.inRoi && !showDebug) return null;
                    if (det.inRoi && det.status === 'IGNORE' && !showDebug) return null;

                    const x = (det.x1 / frameSize.width) * containerSize.w;
                    const y = (det.y1 / frameSize.height) * containerSize.h;
                    const w = ((det.x2 - det.x1) / frameSize.width) * containerSize.w;
                    const h = ((det.y2 - det.y1) / frameSize.height) * containerSize.h;
                    
                    let strokeColor = "#76EFAF"; // Default REGISTERED
                    let fillColor = "rgba(118,239,175,0.15)";
                    let labelText = `${det.className.toUpperCase()} ${Math.round(det.confidence * 100)}%`;

                    if (!det.inRoi || det.status === 'IGNORE') {
                      strokeColor = "rgba(255,255,255,0.4)";
                      fillColor = "rgba(255,255,255,0.05)";
                    } else if (det.status === 'MISPLACED') {
                      strokeColor = "#FF9F43"; // Orange/Red for warning
                      fillColor = "rgba(255,159,67,0.15)";
                      labelText = `MISPLACED: ${det.className.toUpperCase()} ${Math.round(det.confidence * 100)}%`;
                    }
                    
                    return (
                      <g key={i}>
                        <rect x={x} y={y} width={w} height={h} fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeDasharray={(!det.inRoi || det.status === 'IGNORE') ? "4 4" : "0"} />
                        <g transform={`translate(${x}, ${y - 16})`}>
                          <rect x={0} y={0} width={labelText.length * 7 + 10} height={16} fill={strokeColor} />
                          <text x={4} y={12} fill={det.status === 'MISPLACED' || det.status === 'REGISTERED' ? "#000" : "#fff"} fontSize="10" fontWeight="bold" fontFamily="monospace">
                            {labelText}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </svg>

                {/* MISPLACED ACTIVE OVERLAY */}
                {activeMisplaced.length > 0 && (
                  <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, background: 'rgba(0,0,0,0.85)', border: '1px solid #FF9F43', borderRadius: '8px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 8px 32px rgba(255,159,67,0.2)', backdropFilter: 'blur(8px)', minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF9F43', fontWeight: 600, fontSize: '12px' }}>
                      <AlertTriangle size={16} /> <span>MISPLACED ITEM</span>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>CAMERA {String(cameraId).padStart(2, '0')} - {shelfConfig.shelfId}</div>
                    {activeMisplaced.map((det, idx) => (
                      <div key={idx} style={{ marginTop: '4px', background: 'rgba(255,159,67,0.1)', padding: '8px', borderRadius: '4px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ color: '#FF9F43', fontWeight: 600 }}>{det.className.toUpperCase()} DETECTED</div>
                        <div style={{ color: 'rgba(255,255,255,0.7)' }}>Expected: {shelfConfig.registeredObjects.join(', ').toUpperCase() || 'NONE'}</div>
                        <div style={{ color: 'rgba(255,255,255,0.5)' }}>Confidence: {Math.round(det.confidence * 100)}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT SIDE CONTROL PANEL */}
        <div style={{ width: '280px', borderLeft: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,12,16,0.6)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: '12px' }}>ROI CONTROL</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: isLocked ? '#76EFAF' : '#FF9F43', fontSize: '12px', fontWeight: 600 }}>
              ● {isLocked ? 'LOCKED' : 'UNLOCKED'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: roiColors.stroke, fontSize: '12px', fontWeight: 600 }}>
              ● {roiState === 'GREEN' ? 'HEALTHY' : roiState === 'ORANGE' ? 'MISPLACED' : 'EMPTY'}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={() => isManager && setIsLocked(!isLocked)}
                disabled={!isManager}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '6px', cursor: isManager ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', opacity: isManager ? 1 : 0.5 }}
              >
                {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                {isLocked ? 'UNLOCK ROI' : 'LOCK ROI'}
              </button>
              
              {!isLocked && (
                <button 
                  onClick={() => saveRoi(DEFAULT_ROI)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', padding: '10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px' }}
                >
                  <RotateCcw size={14} /> RESET ROI
                </button>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: '12px' }}>REGISTERED OBJECT</div>
            <div style={{ background: 'rgba(118,239,175,0.1)', border: '1px solid rgba(118,239,175,0.3)', color: '#76EFAF', padding: '8px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>
              {shelfConfig.registeredObjects.map(o => o.toUpperCase()).join(', ') || 'NONE CONFIGURED'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: '12px' }}>DETECTION LOGIC</div>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                <span>TOTAL IN ROI:</span>
                <span>{detections.filter(d => d.inRoi).length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#76EFAF' }}>
                <span>REGISTERED:</span>
                <span>{detections.filter(d => d.inRoi && d.status === 'REGISTERED').length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FF9F43' }}>
                <span>MISPLACED:</span>
                <span>{detections.filter(d => d.inRoi && d.status === 'MISPLACED').length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.4)' }}>
                <span>IGNORED:</span>
                <span>{detections.filter(d => d.inRoi && d.status === 'IGNORE').length}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: '12px' }}>DEBUG</div>
            <button 
              onClick={() => setShowDebug(!showDebug)}
              style={{ width: '100%', background: showDebug ? 'rgba(255,77,79,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showDebug ? 'rgba(255,77,79,0.5)' : 'rgba(255,255,255,0.1)'}`, color: showDebug ? '#FF4D4F' : 'rgba(255,255,255,0.7)', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: showDebug ? 600 : 400 }}
            >
              DEBUG MODE: {showDebug ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER CONTROLS */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'monospace' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {connState === 'LIVE' && <><span style={{ color: '#76EFAF' }}>● LIVE</span></>}
            {connState === 'CONNECTING' && <><span style={{ color: 'var(--color-accent)' }}>● CONNECTING TO EDGE AI...</span></>}
            {connState === 'OFFLINE' && <><span style={{ color: '#FF9F43' }}>● EDGE AI OFFLINE</span></>}
            {connState === 'ERROR' && <><span style={{ color: '#FF4D4F' }}>● YOLO11n ERROR</span></>}
            {showDebug && <span style={{ color: '#FF4D4F', marginLeft: '12px', padding: '2px 6px', border: '1px solid #FF4D4F' }}>DEBUG ON</span>}
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', gap: '16px' }}>
          <span>MODEL: YOLO11n.pt</span>
          <span>FPS: {inferenceFps}</span>
        </div>
      </div>
    </motion.div>
  );
}
