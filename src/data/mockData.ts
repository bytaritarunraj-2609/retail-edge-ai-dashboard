import { Tone, CameraState, Action, Camera, DashboardData, Shelf, ShelfState, ActivityLevel } from '../types';

export const STORE_OPEN_HOUR = 9; // 09:00 AM
export const STORE_CLOSE_HOUR = 23;
export const STORE_CLOSE_MINUTE = 30;

// Base simulation time - mock time to ensure we always have intraday data
// We'll set it to 3:18 PM today to match the prompt's example
const getBaseDemoTime = () => {
  const d = new Date();
  d.setHours(15, 18, 0, 0); // 03:18 PM
  return d;
};

export const SIMULATION_CLOCK = {
  time: getBaseDemoTime().getTime(),
  now() {
    return new Date(this.time);
  },
  tick(ms: number) {
    this.time += ms;
  }
};

const now = SIMULATION_CLOCK.now();

// Generate PRESENT data (last 8 ticks)
const generatePresentData = () => {
  const data = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 5000);
    data.push({
      t: d.getTime(),
      displayTime: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      v: Math.floor(400 + Math.random() * 100)
    });
  }
  return data;
};

// Generate DAY data (from STORE_OPEN_HOUR to now)
const generateDayData = () => {
  const data = [];
  const startOfDay = new Date(now);
  startOfDay.setHours(STORE_OPEN_HOUR, 0, 0, 0);
  
  let current = new Date(startOfDay);
  let value = 180;
  
  while (current <= now) {
    data.push({
      t: current.getTime(),
      displayTime: current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      v: value
    });
    current = new Date(current.getTime() + 30 * 60000); // 30 min increments
    
    // Create natural footfall variation pattern
    const hour = current.getHours();
    if (hour < 12) value += Math.floor(Math.random() * 40 + 10); // Morning rise
    else if (hour >= 12 && hour < 14) value += Math.floor(Math.random() * 30 - 15); // Midday plateau
    else if (hour >= 14 && hour < 17) value += Math.floor(Math.random() * 20 - 20); // Afternoon dip
    else value += Math.floor(Math.random() * 50 - 10); // Evening rush
    
    value = Math.max(0, value); // Ensure it doesn't go below 0
  }
  
  // Ensure the current time is the last point
  if (data.length > 0 && data[data.length - 1].t !== now.getTime()) {
    data.push({
      t: now.getTime(),
      displayTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      v: value + Math.floor(Math.random() * 30 - 15)
    });
  }
  
  return data;
};

// Generate WEEK data (Rolling 7 days: 6 days ago -> today)
const generateWeekData = () => {
  const data = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
    data.push({
      t: d.getTime(),
      displayTime: dateStr, // e.g., '16 Sep'
      v: Math.floor(4000 + Math.random() * 2000)
    });
  }
  return data;
};

export const initialFootfallPresent = generatePresentData();
export const initialFootfallDay = generateDayData();
export const initialFootfallWeek = generateWeekData();

const actions: Action[] = [
  { id: 'ACT-1', shelfId: 3, status: 'ACTIVE', tone: 'warning' as Tone, title: 'RESTOCK REQUIRED', camera: 'Shelf Camera 03', product: 'COLA', reason: 'Low stock detected', time: '02:14 PM' },
  { id: 'ACT-2', shelfId: 8, status: 'ACTIVE', tone: 'critical' as Tone, title: 'OUT OF STOCK', camera: 'Shelf Camera 08', product: 'MILK', reason: 'Shelf empty', time: '02:08 PM' },
  { id: 'ACT-3', shelfId: 12, status: 'ACTIVE', tone: 'ai' as Tone, title: 'MISPLACED ITEM', camera: 'Shelf Camera 12', product: 'WATER BOTTLE', reason: 'Wrong shelf class', time: '01:56 PM' }
];

const cameras: Camera[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  state: 'INACTIVE' as CameraState,
  zone: `ZONE ${String(i + 1).padStart(2, '0')}`
}));

const productsAisleA = ['COLA', 'WATER', 'MILK', 'JUICE', 'CHIPS'];
const productsAisleB = ['CEREAL', 'BREAD', 'SNACKS', 'BISCUITS', 'HOUSEHOLD'];

const productCategoryMap: Record<string, string> = {
  'COLA': 'Beverages',
  'WATER': 'Beverages',
  'MILK': 'Dairy',
  'JUICE': 'Beverages',
  'CHIPS': 'Snacks',
  'CEREAL': 'Breakfast',
  'BREAD': 'Bakery',
  'SNACKS': 'Snacks',
  'BISCUITS': 'Bakery',
  'HOUSEHOLD': 'Household'
};

const shelves: Shelf[] = Array.from({ length: 20 }, (_, i) => {
  const isAisleA = i < 10;
  const product = isAisleA ? productsAisleA[i % 5] : productsAisleB[(i - 10) % 5];
  const category = productCategoryMap[product] || 'General';
  
  // Deterministic attributes based on index for the prototype
  let status: ShelfState = 'NORMAL';
  if (i === 2) status = 'RESTOCK';
  if (i === 7) status = 'OUT_OF_STOCK';
  if (i === 11) status = 'MISPLACED';
  
  let activityLevel: ActivityLevel = 'LOW';
  if (i === 2 || i === 4 || i === 8 || i === 15) activityLevel = 'HIGH';
  else if (i % 3 === 0) activityLevel = 'MEDIUM';

  const capacity = 24;
  let stock = status === 'OUT_OF_STOCK' ? 0 : status === 'RESTOCK' ? 3 : capacity;

  return {
    id: i + 1,
    cameraId: i + 1,
    zone: `ZONE ${String(i + 1).padStart(2, '0')}`,
    category,
    product,
    stock,
    capacity,
    status,
    activityLevel,
    lastScan: '02:14 PM',
    lastAnalysis: 'Normal state maintained',
    detectionCount: 14 + (i % 5),
    trackCount: 3 + (i % 3),
    insight: status === 'NORMAL' ? 'Stock levels optimal' : status === 'RESTOCK' ? 'Low stock detected' : status === 'OUT_OF_STOCK' ? 'Shelf empty' : 'Wrong shelf class',
    isRectified: false
  };
});

const kpis: [string, string, string, Tone][] = [
  ['TODAY\'S FOOTFALL', '2,847', '+12.8%', 'normal'],
  ['AVG WAITING', '04:32', '-00:18', 'ai'],
  ['RESTOCK ALERTS', '7', '3 critical', 'warning'],
  ['ACTIVE CAMERAS', '4 / 20', 'resource optimized', 'ai']
];

import { TeamMember, Counter, QueueStatus } from '../types';

const team: TeamMember[] = [
  { id: 'W-01', name: 'Alex M.', role: 'Floor Associate', status: 'ON FLOOR', zone: 'Beverages', currentTask: 'ACT-1', taskProgress: 65, responseTime: '01:42', lastActivity: 'Scanned Shelf 03', tasksCompleted: 14, initials: 'AM' },
  { id: 'W-02', name: 'Sarah K.', role: 'Inventory Associate', status: 'ON FLOOR', zone: 'Dairy', currentTask: 'ACT-2', taskProgress: 20, responseTime: '00:58', lastActivity: 'En route to Dairy', tasksCompleted: 22, initials: 'SK' },
  { id: 'W-03', name: 'Marcus T.', role: 'Floor Supervisor', status: 'ON FLOOR', zone: 'Storewide', currentTask: null, taskProgress: 0, responseTime: '01:15', lastActivity: 'Approved restock', tasksCompleted: 8, initials: 'MT' },
  { id: 'W-04', name: 'Jessica R.', role: 'Checkout Associate', status: 'ON FLOOR', zone: 'Checkout', currentTask: null, taskProgress: 0, responseTime: '00:30', lastActivity: 'Assisted customer', tasksCompleted: 45, initials: 'JR' },
  { id: 'W-05', name: 'David L.', role: 'Stock Associate', status: 'BREAK', zone: 'Break Room', currentTask: null, taskProgress: 0, responseTime: '02:10', lastActivity: 'Clocked out for break', tasksCompleted: 18, initials: 'DL' },
  { id: 'W-06', name: 'Emma W.', role: 'Floor Associate', status: 'ON FLOOR', zone: 'General Aisles', currentTask: 'ACT-3', taskProgress: 90, responseTime: '01:25', lastActivity: 'Fixing misplaced item', tasksCompleted: 11, initials: 'EW' },
  { id: 'W-07', name: 'Michael C.', role: 'Stock Associate', status: 'OFF SHIFT', zone: 'Offsite', currentTask: null, taskProgress: 0, responseTime: '--', lastActivity: 'Shift ended 14:00', tasksCompleted: 31, initials: 'MC' },
];

const counters: Counter[] = [
  { id: 'C-01', number: 1, status: 'ACTIVE', assignedWorkerId: 'W-04', queueLength: 4, estimatedWait: '01:20', lastUpdated: '14:30', isAvailable: false },
  { id: 'C-02', number: 2, status: 'ACTIVE', assignedWorkerId: 'W-08', queueLength: 5, estimatedWait: '01:45', lastUpdated: '14:30', isAvailable: false }, // W-08 is hypothetical or an unlisted worker for realism
  { id: 'C-03', number: 3, status: 'ACTIVE', assignedWorkerId: 'W-09', queueLength: 8, estimatedWait: '02:30', lastUpdated: '14:31', isAvailable: false },
  { id: 'C-04', number: 4, status: 'CLOSED', assignedWorkerId: null, queueLength: 0, estimatedWait: '--', lastUpdated: '14:00', isAvailable: true },
];

const queue: QueueStatus = {
  queueLength: 17,
  estimatedWait: 402, // 6m 42s in seconds
  severity: 'HIGH',
  thresholdLength: 15,
  thresholdWait: 300, // 5 minutes in seconds
  growthRate: '+23% / 5 MIN',
  activeCounterCount: 3,
  totalCounterCount: 4,
  recommendedCounterId: 'C-04',
  recommendationReason: 'Queue length exceeded 15 customers and estimated waiting time exceeded 5 minutes.',
  lastUpdated: 'Just now'
};

export const mockDashboardData: DashboardData = {
  footfallPresent: initialFootfallPresent,
  footfallDay: initialFootfallDay,
  footfallWeek: initialFootfallWeek,
  actions,
  cameras,
  shelves,
  team,
  counters,
  queue,
  kpis
};
