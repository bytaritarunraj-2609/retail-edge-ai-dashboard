export type Tone = 'normal' | 'warning' | 'critical' | 'ai' | 'muted';
export type CameraState = 'INACTIVE' | 'QUEUED' | 'PROCESSING' | 'CAPTURING' | 'ANALYZING' | 'COMPLETE';
export type ShelfState = 'NORMAL' | 'RESTOCK' | 'OUT_OF_STOCK' | 'MISPLACED';
export type ActivityLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type ActionStatus = 'ACTIVE' | 'COMPLETING' | 'COMPLETED';
export type Role = 'MANAGER' | 'WORKER';

export interface Action {
  id: string;
  tone: Tone;
  title: string;
  camera: string;
  product: string;
  reason: string;
  time: string;
  status: ActionStatus;
  shelfId?: number;
}

export interface Camera {
  id: number;
  state: CameraState;
  zone: string;
}

export interface Shelf {
  id: number;
  cameraId: number;
  zone: string;
  category: string;
  product: string;
  stock: number;
  capacity: number;
  status: ShelfState;
  activityLevel: ActivityLevel;
  lastScan: string;
  lastAnalysis: string;
  detectionCount: number;
  trackCount: number;
  insight: string;
  isRectified: boolean;
}

export type FootfallMode = 'present' | 'day' | 'week';

export interface FootfallPoint {
  t: number;
  displayTime: string;
  v: number;
}

export type TeamMemberStatus = 'ON FLOOR' | 'BREAK' | 'OFF SHIFT';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: TeamMemberStatus;
  zone: string;
  currentTask: string | null;
  taskProgress: number; // 0 to 100
  responseTime: string;
  lastActivity: string;
  tasksCompleted: number;
  initials: string;
}

export type CounterStatus = 'CLOSED' | 'OPENING' | 'ACTIVE' | 'CLOSING';

export interface Counter {
  id: string;
  number: number;
  status: CounterStatus;
  assignedWorkerId: string | null;
  queueLength: number;
  estimatedWait: string;
  lastUpdated: string;
  isAvailable: boolean;
}

export type QueueSeverity = 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export interface QueueStatus {
  queueLength: number;
  estimatedWait: number; // in seconds, convert to mm:ss for display
  severity: QueueSeverity;
  thresholdLength: number;
  thresholdWait: number;
  growthRate: string;
  activeCounterCount: number;
  totalCounterCount: number;
  recommendedCounterId: string | null;
  recommendationReason: string | null;
  lastUpdated: string;
}

export interface DashboardData {
  footfallPresent: FootfallPoint[];
  footfallDay: FootfallPoint[];
  footfallWeek: FootfallPoint[];
  actions: Action[];
  cameras: Camera[];
  shelves: Shelf[];
  team: TeamMember[];
  counters: Counter[];
  queue: QueueStatus;
  kpis: [string, string, string, Tone][];
}

export interface AppSettings {
  role: Role;
  theme: 'dark' | 'light';
  motion: 'on' | 'reduced';
  simulation: 'on' | 'off';
}
