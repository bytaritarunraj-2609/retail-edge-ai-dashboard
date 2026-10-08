import React, { useCallback, useEffect, useRef, useState } from 'react';

/** Drop-in UI replacement. Existing Flask camera/ROI routes are preserved. */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5000').replace(/\/$/, '');
const DEFAULT_ROI: Point[] = [
  { x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 },
  { x: 0.9, y: 0.9 }, { x: 0.1, y: 0.9 },
];

type Point = { x: number; y: number };
type Camera = { id: number; name: string; active?: boolean; width?: number; height?: number };
type CameraList = { cameras?: Camera[]; active_camera_id?: number | null; default_camera_id?: number | null };
type CameraStatus = {
  status?: string;
  model?: string;
  frame_width?: number;
  frame_height?: number;
  shelf_status?: string;
  bottle_count?: number;
  misplaced_objects?: string[];
  roi_points?: Point[];
  roi_locked?: boolean;
  confidence?: number;
  inference_fps?: number;
  roi_version?: number;
};
interface WebcamShelfPrototypeProps {
  cameraId: number; // Logical Store Map camera, NOT OpenCV source index.
  shelf: unknown;
  onClose: () => void;
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const validPoints = (x: unknown): x is Point[] =>
  Array.isArray(x) && x.length === 4 && x.every(p =>
    p && typeof p.x === 'number' && typeof p.y === 'number' &&
    Number.isFinite(p.x) && Number.isFinite(p.y) &&
    p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1);
const equalPoints = (a: Point[], b: Point[]) =>
  a.length === b.length && a.every((p, i) =>
    Math.abs(p.x - b[i].x) < 0.0002 && Math.abs(p.y - b[i].y) < 0.0002);

// Require a non-self-intersecting convex quadrilateral with meaningful area.
function validQuad(pts: Point[]): boolean {
  if (!validPoints(pts)) return false;
  let orientation = 0;
  for (let i = 0; i < 4; i++) {
    const a = pts[i], b = pts[(i + 1) % 4], c = pts[(i + 2) % 4];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) < 0.0001) return false;
    const direction = Math.sign(cross);
    if (orientation && orientation !== direction) return false;
    orientation = direction;
  }
  const area = Math.abs(pts.reduce((sum, p, i) => {
    const q = pts[(i + 1) % 4];
    return sum + p.x * q.y - q.x * p.y;
  }, 0)) / 2;
  return area > 0.002;
}

async function jsonResponse<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().catch(() => '')}`);
  return res.json() as Promise<T>;
}

export function WebcamShelfPrototype({ cameraId, shelf, onClose }: WebcamShelfPrototypeProps) {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [sourceId, setSourceId] = useState<number | null>(null);
  const [status, setStatus] = useState<CameraStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roi, setRoi] = useState<Point[]>(DEFAULT_ROI);
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roiError, setRoiError] = useState<string | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [imageError, setImageError] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<Point[]>(DEFAULT_ROI);
  const dragRef = useRef<{ index: number; pointerId: number } | null>(null);
  const editModeRef = useRef<'SYNCED' | 'EDITING' | 'SAVING' | 'ERROR'>('SYNCED');
  const awaitingBackendRef = useRef<Point[] | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Discover sources without binding the interval to the changing selection state.
  useEffect(() => {
    let disposed = false;
    let inFlight = false;
    const poll = async () => {
      if (inFlight || disposed) return;
      inFlight = true;
      try {
        const data = await jsonResponse<CameraList>(await fetch(`${BASE_URL}/api/cameras`));
        if (disposed) return;
        const found = data.cameras ?? [];
        setCameras(found);
        setSourceId(previous => {
          // Follow backend-driven fallback only if previously selected source vanished.
          if (previous !== null && found.some(c => c.id === previous)) return previous;
          const candidate = [data.active_camera_id, data.default_camera_id, found[0]?.id]
            .find(v => v !== null && v !== undefined && found.some(c => c.id === v));
          return typeof candidate === 'number' ? candidate : null;
        });
        setError(null);
      } catch (e) {
        if (!disposed) setError(`Camera API unavailable: ${String(e)}`);
      } finally { inFlight = false; }
    };
    void poll();
    const timer = window.setInterval(() => { void poll(); }, 3000);
    return () => { disposed = true; window.clearInterval(timer); };
  }, []);

  // Activation happens once per actual selected physical source, not on camera-list refresh.
  useEffect(() => {
    if (sourceId === null) return;
    let cancelled = false;
    setStatus(null);
    setImageError(false);
    editModeRef.current = 'SYNCED';
    awaitingBackendRef.current = null;
    setRoiError(null);
    // Use actual request below so errors are always surfaced and never unhandled.
    const request = async () => {
      try {
        await jsonResponse<unknown>(await fetch(`${BASE_URL}/api/cameras/${sourceId}/activate`, { method: 'POST' }));
      } catch (e) {
        if (!cancelled) setError(`Camera activation failed: ${String(e)}`);
      }
    };
    void request();
    return () => { cancelled = true; };
  }, [sourceId]);

  // Poll serially; never let status responses replace an ROI being edited or saved.
  useEffect(() => {
    if (sourceId === null) return;
    let disposed = false;
    let busy = false;
    const poll = async () => {
      if (disposed || busy) return;
      busy = true;
      try {
        const data = await jsonResponse<CameraStatus>(await fetch(`${BASE_URL}/api/cameras/${sourceId}/status`));
        if (disposed) return;
        setStatus(data);
        if (validPoints(data.roi_points)) {
          const incoming = data.roi_points;
          if (editModeRef.current === 'SYNCED') {
            if (awaitingBackendRef.current) {
              if (equalPoints(incoming, awaitingBackendRef.current)) awaitingBackendRef.current = null;
              // Ignore an older GET until backend reports the committed ROI.
            } else {
              draftRef.current = incoming;
              setRoi(incoming);
            }
          }
        }
        if (typeof data.roi_locked === 'boolean' && editModeRef.current === 'SYNCED') setLocked(data.roi_locked);
      } catch (e) {
        if (!disposed) setError(`Camera status unavailable: ${String(e)}`);
      } finally { busy = false; }
    };
    void poll();
    const timer = window.setInterval(() => { void poll(); }, 250);
    return () => { disposed = true; window.clearInterval(timer); };
  }, [sourceId]);

  // ResizeObserver ensures the displayed image and ROI use the exact same fitted rectangle.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect) setViewportSize({ width: rect.width, height: rect.height });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [sourceId]);

  const currentCamera = cameras.find(c => c.id === sourceId);
  const frameWidth = Math.max(1, status?.frame_width || currentCamera?.width || 640);
  const frameHeight = Math.max(1, status?.frame_height || currentCamera?.height || 480);
  const scale = viewportSize.width > 0 && viewportSize.height > 0
    ? Math.min(viewportSize.width / frameWidth, viewportSize.height / frameHeight)
    : 1;
  const shownWidth = Math.max(0, frameWidth * scale);
  const shownHeight = Math.max(0, frameHeight * scale);
  const roiColor = status?.shelf_status === 'MISPLACED' ? '#ffac3e'
    : status?.shelf_status === 'OUT_OF_STOCK' ? '#fa6464'
    : ['AVAILABLE', 'NORMAL'].includes(status?.shelf_status || '') ? '#4be4a5' : '#74cce9';

  const pointerPosition = useCallback((event: React.PointerEvent): Point | null => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return null;
    return { x: clamp((event.clientX - rect.left) / rect.width), y: clamp((event.clientY - rect.top) / rect.height) };
  }, []);

  const moveVertex = (index: number, point: Point) => {
    const next = draftRef.current.map((p, i) => i === index ? point : p);
    if (!validQuad(next)) return;
    draftRef.current = next;
    setRoi(next);
  };

  const persist = async (points: Point[]) => {
    if (sourceId === null) return;
    setSaving(true);
    setRoiError(null);
    editModeRef.current = 'SAVING';
    try {
      const body = JSON.stringify({ points });
      const reply = await jsonResponse<{ points?: Point[] }>(await fetch(`${BASE_URL}/api/cameras/${sourceId}/roi`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
      }));
      const confirmed = validPoints(reply?.points) ? reply.points : points;
      awaitingBackendRef.current = confirmed;
      draftRef.current = confirmed;
      if (mountedRef.current) setRoi(confirmed);
      editModeRef.current = 'SYNCED';
    } catch (e) {
      editModeRef.current = 'ERROR';
      if (mountedRef.current) setRoiError(`ROI not saved: ${String(e)}`);
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  const finishDrag = (event: React.PointerEvent<SVGSVGElement>, cancelled = false) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!cancelled) {
      const point = pointerPosition(event);
      if (point) moveVertex(drag.index, point);
    }
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (cancelled) {
      editModeRef.current = 'ERROR';
      setRoiError('ROI drag cancelled. Drag again to save.');
    } else {
      void persist([...draftRef.current]);
    }
  };

  const toggleLock = async () => {
    if (sourceId === null || saving) return;
    const next = !locked;
    try {
      await jsonResponse<unknown>(await fetch(`${BASE_URL}/api/cameras/${sourceId}/roi/lock`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: next }),
      }));
      setLocked(next);
    } catch (e) { setRoiError(`Unable to change ROI lock: ${String(e)}`); }
  };

  const resetRoi = () => {
    if (locked || saving) return;
    draftRef.current = DEFAULT_ROI.map(p => ({ ...p }));
    setRoi(draftRef.current);
    void persist(draftRef.current);
  };

  // The preview stage and the physical video rectangle are deliberately distinct.
  // Only the inner viewport is used to position the SVG and its handles.
  const stockState = status?.shelf_status ?? 'UNKNOWN';
  const cameraState = status?.status ?? 'CONNECTING';
  const misplaced = Array.isArray(status?.misplaced_objects) ? status.misplaced_objects : [];
  const registeredProduct = typeof shelf === 'object' && shelf !== null
    ? String((shelf as { product?: string; name?: string }).product ?? (shelf as { name?: string }).name ?? 'BOTTLE')
    : 'BOTTLE';
  const shell: React.CSSProperties = {
    width: '100%', height: '100%', minHeight: 510, display: 'flex', flexDirection: 'column',
    background: '#090f19', color: '#eaf3fa', border: '1px solid #253444',
    borderRadius: 13, boxSizing: 'border-box', overflow: 'hidden',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  };
  const tiny: React.CSSProperties = { fontSize: 10, fontWeight: 750, letterSpacing: '0.075em', color: '#8497aa' };
  const action: React.CSSProperties = {
    width: '100%', background: '#17212d', border: '1px solid #34465a', color: '#e5edf6',
    borderRadius: 7, padding: '10px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
  };

  return (
    <div style={shell}>
      <header style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        flexWrap: 'wrap', borderBottom: '1px solid #243244', background: '#0c1420', flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 800 }}>Camera Prototype — Cam {String(cameraId).padStart(2, '0')}</span>
        <span style={{ fontSize: 11, color: '#7f95aa' }}>Live shelf monitoring · YOLO11n</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={tiny}>VIDEO SOURCE</span>
          <select aria-label="Physical video source" value={sourceId ?? ''}
            onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n)) setSourceId(n); }}
            style={{ ...action, width: 'auto', minWidth: 118, maxWidth: 185, padding: '7px 9px' }}>
            {cameras.length === 0 && <option value="">No cameras found</option>}
            {cameras.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="button" onClick={onClose} style={{ ...action, width: 'auto', padding: '7px 12px' }}>Close</button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, flexWrap: 'wrap' }}>
        <main style={{ flex: '1 1 560px', minWidth: 0, minHeight: 430, display: 'flex',
          flexDirection: 'column', background: '#03080f', position: 'relative' }}>
          <div ref={stageRef} style={{ flex: 1, minHeight: 420, width: '100%', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {sourceId !== null && shownWidth > 0 && shownHeight > 0 ? (
              <div ref={viewportRef} style={{ position: 'relative', flex: 'none', width: shownWidth,
                height: shownHeight, background: '#050a10' }}>
                <img key={sourceId} src={`${BASE_URL}/api/cameras/${sourceId}/stream`}
                  alt="Live shelf camera" draggable={false} onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
                  style={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%',
                    objectFit: 'fill', userSelect: 'none', pointerEvents: 'none' }} />
                <svg aria-label="Editable shelf ROI on camera feed" viewBox={`0 0 ${frameWidth} ${frameHeight}`}
                  preserveAspectRatio="none"
                  onPointerMove={event => {
                    const drag = dragRef.current;
                    if (!drag || drag.pointerId !== event.pointerId) return;
                    const point = pointerPosition(event);
                    if (point) moveVertex(drag.index, point);
                  }}
                  onPointerUp={event => finishDrag(event)}
                  onPointerCancel={event => finishDrag(event, true)}
                  style={{ position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%',
                    overflow: 'visible', touchAction: 'none', pointerEvents: 'none' }}>
                  <polygon points={roi.map(p => `${p.x * frameWidth},${p.y * frameHeight}`).join(' ')}
                    fill={roiColor} fillOpacity="0.13" stroke={roiColor}
                    strokeWidth={Math.max(2, frameWidth / 260)} strokeLinejoin="round"
                    style={{ pointerEvents: 'none' }} />
                  {!locked && roi.map((p, i) => (
                    <g key={i} transform={`translate(${p.x * frameWidth} ${p.y * frameHeight})`}
                      onPointerDown={event => {
                        if (saving) return;
                        event.preventDefault();
                        event.stopPropagation();
                        editModeRef.current = 'EDITING';
                        dragRef.current = { index: i, pointerId: event.pointerId };
                        event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId);
                      }}
                      style={{ cursor: saving ? 'wait' : 'grab', pointerEvents: 'all' }}>
                      <circle r={Math.max(18, frameWidth * .027)} fill="transparent" />
                      <circle r={Math.max(6, frameWidth * .009)} fill="#ffffff" stroke={roiColor}
                        strokeWidth={Math.max(2, frameWidth / 330)} />
                      <text x={12} y={-12} fontSize={Math.max(12, frameWidth / 55)}
                        fill={roiColor} fontWeight="bold">P{i + 1}</text>
                    </g>
                  ))}
                </svg>
                <div style={{ position: 'absolute', top: 9, left: 9, pointerEvents: 'none',
                  borderRadius: 6, background: '#070d17d9', padding: '5px 9px',
                  fontSize: 11, color: cameraState === 'LIVE' ? '#8df4be' : '#ffd18b' }}>
                  ● {cameraState} · {stockState}
                </div>
              </div>
            ) : <span style={{ color: '#8c9cad', fontSize: 13 }}>Discovering physical camera sources…</span>}
            {imageError && <div role="alert" style={{ position: 'absolute', bottom: 15,
              left: 18, right: 18, borderRadius: 7, padding: 12, background: '#681c27eb',
              fontSize: 12 }}>The live video stream is unavailable. Check the Flask MJPEG endpoint.</div>}
          </div>
          <div style={{ padding: '9px 14px', display: 'flex', justifyContent: 'space-between',
            gap: 12, flexWrap: 'wrap', borderTop: '1px solid #253444', fontSize: 11, color: '#92a4b5' }}>
            <span>Cam {String(cameraId).padStart(2, '0')} · {currentCamera?.name ?? 'Connecting'}</span>
            <span>{frameWidth} × {frameHeight} · {locked ? 'ROI locked' : 'Drag the four handles directly on the image'}</span>
          </div>
        </main>

        <aside style={{ flex: '0 0 240px', boxSizing: 'border-box', background: '#0d1520',
          borderLeft: '1px solid #283747', padding: 15, display: 'flex', flexDirection: 'column',
          gap: 17, minWidth: 210 }}>
          <section style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <span style={tiny}>ROI CONTROL</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: locked ? '#95b6c8' : '#ffb350' }}>
              ● {locked ? 'LOCKED' : 'UNLOCKED'}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: roiColor }}>● {stockState}</span>
            <button type="button" disabled={sourceId === null || saving}
              onClick={() => void toggleLock()} style={{ ...action, opacity: saving ? .5 : 1 }}>
              {locked ? '◉ UNLOCK ROI' : '▢ LOCK ROI'}
            </button>
            <button type="button" disabled={locked || saving}
              onClick={resetRoi} style={{ ...action, opacity: locked || saving ? .5 : 1 }}>↺ RESET ROI</button>
            {saving && <span style={{ fontSize: 11, color: '#edc16b' }}>Saving ROI…</span>}
            {roiError && <span role="alert" style={{ fontSize: 11, color: '#ff9c9c' }}>{roiError}</span>}
          </section>
          <section style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <span style={tiny}>REGISTERED OBJECT</span>
            <div style={{ border: '1px solid #285443', color: '#70e0b0', background: '#10251e',
              borderRadius: 5, padding: '9px 10px', fontSize: 12, fontWeight: 800 }}>
              {registeredProduct}
            </div>
          </section>
          <section style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <span style={tiny}>DETECTION LOGIC · LIVE</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '7px 4px', fontSize: 12 }}>
              <span style={{ color: '#b3c2d0' }}>Bottles inside ROI</span><b style={{ color: '#77deb0' }}>{status?.bottle_count ?? '—'}</b>
              <span style={{ color: '#b3c2d0' }}>Misplaced classes</span><b style={{ color: '#ffb252' }}>{misplaced.length}</b>
              <span style={{ color: '#b3c2d0' }}>Camera</span><b>{cameraState}</b>
              <span style={{ color: '#b3c2d0' }}>Model</span><b>{status?.model ?? '—'}</b>
            </div>
            {misplaced.length > 0 && <div style={{ borderRadius: 6, padding: 9,
              background: '#352413', border: '1px solid #71501e', fontSize: 11, color: '#ffc77b' }}>
              MISPLACED: {misplaced.join(', ')}
            </div>}
            <div style={{ fontSize: 10, lineHeight: 1.5, color: '#7d90a5' }}>
              Only accepted ROI detections should affect these values. The backend must enforce ROI filtering.
            </div>
          </section>
          {error && <div role="alert" style={{ borderRadius: 6, padding: 10,
            background: '#3b1b22', color: '#ffb6b6', fontSize: 11, overflowWrap: 'anywhere' }}>{error}</div>}
          <div style={{ marginTop: 'auto', color: '#64798c', fontSize: 10 }}>
            STORE PULSE · REAL CAMERA MODE
          </div>
        </aside>
      </div>
    </div>
  );
}
