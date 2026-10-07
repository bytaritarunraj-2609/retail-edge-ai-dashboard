import { IntelligenceDataAdapter } from './IntelligenceDataAdapter';
import { DashboardData, Shelf, ShelfState, Action, ActionStatus, Tone, Camera, CameraState } from '../types';
import { mockDashboardData } from '../data/mockData';

// ─── Back-end status → Frontend ShelfState ──────────────────────────────────
// Backend (shelf_analytics.py) uses:  "AVAILABLE" | "OUT_OF_STOCK" | "UNKNOWN"
// Frontend type (types/index.ts) uses: "NORMAL" | "RESTOCK" | "OUT_OF_STOCK" | "MISPLACED"
function mapStockStatus(backendStatus: string, misplacedCount: number): ShelfState {
  if (misplacedCount > 0) return 'MISPLACED';
  switch (backendStatus) {
    case 'AVAILABLE':    return 'NORMAL';
    case 'OUT_OF_STOCK': return 'OUT_OF_STOCK';
    case 'RESTOCK':      return 'RESTOCK';
    default:             return 'NORMAL';
  }
}

// ─── Priority string → Tone ──────────────────────────────────────────────────
function mapPriority(priority: string): Tone {
  switch (priority?.toUpperCase()) {
    case 'HIGH':   return 'critical';
    case 'MEDIUM': return 'warning';
    default:       return 'normal';
  }
}

// ─── Skeleton shelves/cameras from mock data so the Store Map is never empty ─
const BASE_SHELVES: Shelf[] = mockDashboardData.shelves.map(s => ({ ...s }));
const BASE_CAMERAS: Camera[] = mockDashboardData.cameras.map(c => ({ ...c }));

export class LiveIntelligenceAdapter implements IntelligenceDataAdapter {
  private data: DashboardData = {
    ...mockDashboardData,
    shelves:       BASE_SHELVES.map(s => ({ ...s })),
    cameras:       BASE_CAMERAS.map(c => ({ ...c })),
    actions:       [],
    footfallPresent: [...mockDashboardData.footfallPresent],
    footfallDay:     [...mockDashboardData.footfallDay],
    footfallWeek:    [...mockDashboardData.footfallWeek],
    team:            [...mockDashboardData.team],
    kpis:            [],
  };

  private listeners:  Set<() => void> = new Set();
  private interval:   number | null   = null;
  private isFetching                  = false;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5000';
    this.startPolling();
  }

  // ── Polling lifecycle ─────────────────────────────────────────────────────
  private startPolling() {
    this.fetchAll();                                      // immediate first fetch
    this.interval = window.setInterval(() => this.fetchAll(), 3000);
  }

  private stopPolling() {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  // ── Core fetch ────────────────────────────────────────────────────────────
  private async fetchAll() {
    if (this.isFetching) return;
    this.isFetching = true;
    try {
      const [dashRes, shelfRes, eventsRes, tasksRes] = await Promise.allSettled([
        fetch(`${this.baseUrl}/api/dashboard`),
        fetch(`${this.baseUrl}/api/shelf-status`),
        fetch(`${this.baseUrl}/api/shelf-events`),
        fetch(`${this.baseUrl}/api/tasks`),
      ]);

      // ── /api/dashboard ──────────────────────────────────────────────────
      if (dashRes.status === 'fulfilled' && dashRes.value.ok) {
        const d = await dashRes.value.json();
        this.applyDashboard(d);
      }

      // ── /api/shelf-status ───────────────────────────────────────────────
      if (shelfRes.status === 'fulfilled' && shelfRes.value.ok) {
        const s = await shelfRes.value.json();
        if (s.available && s.data) this.applyShelfStatus(s.data);
      }

      // ── /api/shelf-events + /api/tasks → actions ────────────────────────
      const newActions: Action[] = [];

      if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
        const ev = await eventsRes.value.json();
        if (Array.isArray(ev.events)) {
          ev.events.forEach((e: any, i: number) => {
            newActions.push({
              id:      `event-${e.id ?? i}`,
              tone:    mapPriority(e.priority),
              title:   e.event_type ?? 'Event',
              camera:  `Shelf ${e.shelf_id ?? '?'}`,
              product: 'System Event',
              reason:  e.message ?? '',
              time:    e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : '--',
              status:  'ACTIVE' as ActionStatus,
              shelfId: typeof e.shelf_id === 'number' ? e.shelf_id : undefined,
            });
          });
        }
      }

      if (tasksRes.status === 'fulfilled' && tasksRes.value.ok) {
        const tv = await tasksRes.value.json();
        const taskArr = Array.isArray(tv) ? tv : (Array.isArray(tv.value) ? tv.value : []);
        taskArr.forEach((t: any) => {
          newActions.push({
            id:      `task-${t.id}`,
            tone:    mapPriority(t.priority),
            title:   t.title ?? 'Task',
            camera:  t.location ?? 'Store',
            product: 'Staff Task',
            reason:  `Priority: ${t.priority}`,
            time:    t.created_at ? new Date(t.created_at).toLocaleTimeString() : '--',
            status:  t.status === 'PENDING' ? 'ACTIVE' as ActionStatus : 'COMPLETED' as ActionStatus,
          });
        });
      }

      if (newActions.length > 0) {
        this.data = { ...this.data, actions: newActions };
      }

      this.notify();
    } catch (err) {
      // Backend offline — keep existing data silently
      console.warn('[LiveAdapter] Backend unavailable, retrying…', err);
    } finally {
      this.isFetching = false;
    }
  }

  // ── Map /api/dashboard into DashboardData ────────────────────────────────
  private applyDashboard(d: any) {
    // footfall chart → footfallDay
    if (Array.isArray(d.chart)) {
      this.data.footfallDay = d.chart.map((c: any) => ({
        t:           new Date(c.date).getTime(),
        displayTime: c.date,
        v:           c.footfall ?? 0,
      }));
    }

    // metrics → kpis
    if (d.metrics) {
      const m = d.metrics;
      this.data.kpis = [
        ['Store Traffic',  String(m.footfall ?? 0),              'Today',      'normal'  as Tone],
        ['Avg Wait',       `${m.average_wait ?? 0}m`,            'Queue',      'warning' as Tone],
        ['Shelf Avail',    `${m.shelf_availability ?? 0}%`,      'Overall',    'ai'      as Tone],
        ['Stockouts',      String(m.stockouts ?? 0),             'Action Req', 'critical'as Tone],
      ];
    }
  }

  // ── Map /api/shelf-status into shelves[] ─────────────────────────────────
  // The backend currently returns a SINGLE latest shelf record.
  // We overlay it onto the shelf whose id matches the shelf_id string
  // (SHELF_01 → id 1), or fall back to shelf id=1.
  private applyShelfStatus(s: any) {
    // Convert "SHELF_01" → 1, etc.
    const numericId = (() => {
      if (typeof s.shelf_id === 'number') return s.shelf_id;
      const m = String(s.shelf_id).match(/(\d+)/);
      return m ? parseInt(m[1], 10) : 1;
    })();

    const misplacedNames: string[] = Array.isArray(s.misplaced_objects)
      ? s.misplaced_objects.map((o: any) => (typeof o === 'string' ? o : o.name ?? String(o)))
      : [];

    const shelfStatus = mapStockStatus(s.stock_status, misplacedNames.length);
    const lastScanTime = s.timestamp ? new Date(s.timestamp).toLocaleTimeString() : '--';
    const confPct = ((s.average_confidence ?? 0) * 100).toFixed(1);
    const insight = misplacedNames.length > 0
      ? `Misplaced items: ${misplacedNames.join(', ')}`
      : `Confidence ${confPct}% — ${shelfStatus === 'NORMAL' ? 'All items correctly placed' : shelfStatus}`;

    const updatedShelves = this.data.shelves.map(shelf => {
      if (shelf.id !== numericId) return shelf;
      return {
        ...shelf,
        stock:          s.bottle_count ?? shelf.stock,
        status:         shelfStatus,
        lastScan:       lastScanTime,
        lastAnalysis:   `YOLO11n · Conf ${confPct}% · ${new Date(s.timestamp ?? '').toLocaleTimeString()}`,
        detectionCount: s.bottle_count ?? shelf.detectionCount,
        insight,
        activityLevel:  (s.bottle_count ?? 0) > 5 ? 'HIGH' : (s.bottle_count ?? 0) > 2 ? 'MEDIUM' : 'LOW',
      } as Shelf;
    });

    // Update camera state for the corresponding camera
    const updatedCameras = this.data.cameras.map(cam => {
      if (cam.id !== numericId) return cam;
      return { ...cam, state: 'COMPLETE' as CameraState };
    });

    this.data = { ...this.data, shelves: updatedShelves, cameras: updatedCameras };
  }

  // ── Pub/sub ───────────────────────────────────────────────────────────────
  private notify() {
    this.listeners.forEach(l => l());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stopPolling();
    };
  }

  getDashboardData(): DashboardData {
    return this.data;
  }

  // ── Mutations ─────────────────────────────────────────────────────────────
  updateShelfStatus(_shelfId: number, _status: ShelfState, _isRectified: boolean): void {
    // Live mode: shelf status comes from the backend; local overrides not persisted
  }

  markNotificationRead(actionId: string): void {
    if (actionId.startsWith('task-')) {
      const taskId = actionId.replace('task-', '');
      fetch(`${this.baseUrl}/api/tasks/${taskId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      }).catch(() => {/* silent */});
    }
    this.data = {
      ...this.data,
      actions: this.data.actions.filter(a => a.id !== actionId),
    };
    this.notify();
  }

  simulateScan(_shelfId: number): void { /* live — no-op */ }
  tickSimulation(): void               { /* live — no-op */ }
  deployCounter(_counterId: string, _workerId: string): void {}
  closeCounter(_counterId: string): void {}
}

export const liveAdapterInstance = new LiveIntelligenceAdapter();
