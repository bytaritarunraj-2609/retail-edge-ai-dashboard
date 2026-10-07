import { IntelligenceDataAdapter } from './IntelligenceDataAdapter';
import { DashboardData, ShelfState } from '../types';
import { mockDashboardData, SIMULATION_CLOCK } from '../data/mockData';

export class MockIntelligenceAdapter implements IntelligenceDataAdapter {
  private data: DashboardData = { 
    ...mockDashboardData, 
    shelves: [...mockDashboardData.shelves], 
    actions: [...mockDashboardData.actions], 
    footfallPresent: [...mockDashboardData.footfallPresent],
    footfallDay: [...mockDashboardData.footfallDay],
    footfallWeek: [...mockDashboardData.footfallWeek],
    team: [...mockDashboardData.team]
  };
  private listeners: Set<() => void> = new Set();
  
  private notify() {
    this.listeners.forEach(l => l());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getDashboardData(): DashboardData {
    return this.data;
  }

  updateShelfStatus(shelfId: number, status: ShelfState, isRectified: boolean): void {
    const shelfIndex = this.data.shelves.findIndex(s => s.id === shelfId);
    if (shelfIndex === -1) return;
    
    const updatedShelf = { ...this.data.shelves[shelfIndex], status, isRectified };
    this.data.shelves[shelfIndex] = updatedShelf;

    // Handle action transitioning
    if (isRectified) {
      const actionIndex = this.data.actions.findIndex(a => a.shelfId === shelfId && a.status === 'ACTIVE');
      if (actionIndex !== -1) {
        this.data.actions[actionIndex] = { ...this.data.actions[actionIndex], status: 'COMPLETING' };
        
        // Remove after 2 seconds
        setTimeout(() => {
          this.data.actions = this.data.actions.filter(a => !(a.shelfId === shelfId && a.status === 'COMPLETING'));
          this.notify();
        }, 2000);
      }
    } else {
      // If un-rectified and status is a problem, we could potentially create an action, but mock is fine for now
    }
    
    this.data = { ...this.data, shelves: [...this.data.shelves], actions: [...this.data.actions] };
    this.notify();
  }

  markNotificationRead(actionId: string): void {
    this.data.actions = this.data.actions.filter(a => a.id !== actionId);
    this.data = { ...this.data, actions: [...this.data.actions] };
    this.notify();
  }

  simulateScan(shelfId: number): void {
    const shelfIndex = this.data.shelves.findIndex(s => s.id === shelfId);
    if (shelfIndex === -1) return;
    
    const updatedShelf = { 
      ...this.data.shelves[shelfIndex],
      lastScan: SIMULATION_CLOCK.now().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.data.shelves[shelfIndex] = updatedShelf;
    this.data = { ...this.data, shelves: [...this.data.shelves] };
    this.notify();
  }

  tickSimulation(): void {
    SIMULATION_CLOCK.tick(5000);
    const now = SIMULATION_CLOCK.now();
    
    // 1. Update PRESENT: rolling window of last 8 ticks
    const lastPresent = this.data.footfallPresent[this.data.footfallPresent.length - 1];
    const newPresent = {
      t: now.getTime(),
      displayTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      v: Math.max(0, lastPresent.v + Math.floor(Math.random() * 50 - 25))
    };
    const nextPresent = [...this.data.footfallPresent.slice(1), newPresent];

    // 2. Update DAY: update the last point's value
    const lastDay = this.data.footfallDay[this.data.footfallDay.length - 1];
    const nextDay = [...this.data.footfallDay];
    nextDay[nextDay.length - 1] = {
      ...lastDay,
      t: now.getTime(), // optional: track actual latest time in the day point
      displayTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      v: Math.max(0, lastDay.v + Math.floor(Math.random() * 10 - 2)) // accumulate slightly
    };

    // 3. Update WEEK: update today's accumulated value
    const lastWeek = this.data.footfallWeek[this.data.footfallWeek.length - 1];
    const nextWeek = [...this.data.footfallWeek];
    nextWeek[nextWeek.length - 1] = {
      ...lastWeek,
      v: Math.max(0, lastWeek.v + Math.floor(Math.random() * 20 - 5))
    };

    // 4. Update TEAM task progress
    const nextTeam = this.data.team.map(member => {
      if (member.currentTask && member.status === 'ON FLOOR') {
        const increment = Math.floor(Math.random() * 5); // 0-4% progress
        const nextProgress = Math.min(100, member.taskProgress + increment);
        return { ...member, taskProgress: nextProgress };
      }
      return member;
    });

    // 5. Update Queue simulation
    const nextQueue = { ...this.data.queue };
    const nextCounters = [...this.data.counters];
    const activeCount = nextCounters.filter(c => c.status === 'ACTIVE').length;
    
    // Gradual simulation logic
    if (activeCount === nextCounters.length) {
      // Optimal or over-staffed, reduce queue
      if (nextQueue.queueLength > 0) {
        // Randomly reduce 1 or 2
        nextQueue.queueLength = Math.max(0, nextQueue.queueLength - Math.floor(Math.random() * 2 + 1));
      }
      if (nextQueue.estimatedWait > 0) {
        nextQueue.estimatedWait = Math.max(0, nextQueue.estimatedWait - Math.floor(Math.random() * 15 + 10)); // reduce wait by 10-25s
      }
    } else if (activeCount < 4) {
      // Under-staffed, build queue slowly if less than 18
      if (nextQueue.queueLength < 18 && Math.random() > 0.5) {
        nextQueue.queueLength += 1;
        nextQueue.estimatedWait += Math.floor(Math.random() * 20 + 10);
      }
    }
    
    nextQueue.activeCounterCount = activeCount;
    
    // Update severity based on new queue state
    if (nextQueue.queueLength > nextQueue.thresholdLength || nextQueue.estimatedWait > nextQueue.thresholdWait) {
      nextQueue.severity = nextQueue.queueLength > nextQueue.thresholdLength + 5 ? 'CRITICAL' : 'HIGH';
      nextQueue.recommendedCounterId = nextCounters.find(c => c.isAvailable)?.id || null;
      nextQueue.recommendationReason = `Queue length exceeded ${nextQueue.thresholdLength} customers.`;
    } else if (nextQueue.queueLength > nextQueue.thresholdLength - 3) {
      nextQueue.severity = 'ELEVATED';
      nextQueue.recommendedCounterId = null;
    } else {
      nextQueue.severity = 'NORMAL';
      nextQueue.recommendedCounterId = null;
    }

    this.data = { 
      ...this.data, 
      footfallPresent: nextPresent,
      footfallDay: nextDay,
      footfallWeek: nextWeek,
      team: nextTeam,
      queue: nextQueue,
      counters: nextCounters
    };
    this.notify();
  }

  deployCounter(counterId: string, workerId: string): void {
    const counterIndex = this.data.counters.findIndex(c => c.id === counterId);
    const workerIndex = this.data.team.findIndex(w => w.id === workerId);
    if (counterIndex === -1 || workerIndex === -1) return;

    // 1. Transition counter to OPENING
    const nextCounters = [...this.data.counters];
    nextCounters[counterIndex] = {
      ...nextCounters[counterIndex],
      status: 'OPENING',
      assignedWorkerId: workerId,
      isAvailable: false
    };

    // 2. Transition worker state
    const nextTeam = [...this.data.team];
    nextTeam[workerIndex] = {
      ...nextTeam[workerIndex],
      zone: 'Checkout',
      currentTask: 'QUEUE MANAGEMENT',
      taskProgress: 10
    };

    this.data = { ...this.data, counters: nextCounters, team: nextTeam };
    this.notify();

    // 3. After a brief delay, transition to ACTIVE
    setTimeout(() => {
      const activeCounters = [...this.data.counters];
      const cIndex = activeCounters.findIndex(c => c.id === counterId);
      if (cIndex !== -1 && activeCounters[cIndex].status === 'OPENING') {
        activeCounters[cIndex] = { ...activeCounters[cIndex], status: 'ACTIVE' };
        this.data = { ...this.data, counters: activeCounters };
        
        // Add a notification
        this.data.actions = [
          {
            id: `ACT-${Date.now()}`,
            tone: 'normal',
            title: 'COUNTER DEPLOYED',
            camera: 'Cam 21',
            product: 'Queue Management',
            reason: `${nextTeam[workerIndex].name} assigned to Counter ${activeCounters[cIndex].number}.`,
            time: SIMULATION_CLOCK.now().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'ACTIVE'
          },
          ...this.data.actions
        ];
        
        this.notify();
      }
    }, 2500); // 2.5 second simulated deployment
  }

  closeCounter(counterId: string): void {
    const counterIndex = this.data.counters.findIndex(c => c.id === counterId);
    if (counterIndex === -1) return;

    const counter = this.data.counters[counterIndex];
    if (counter.status !== 'ACTIVE') return;

    const workerId = counter.assignedWorkerId;

    // 1. Transition to CLOSING
    const nextCounters = [...this.data.counters];
    nextCounters[counterIndex] = { ...nextCounters[counterIndex], status: 'CLOSING' };
    this.data = { ...this.data, counters: nextCounters };
    this.notify();

    setTimeout(() => {
      const closedCounters = [...this.data.counters];
      const cIndex = closedCounters.findIndex(c => c.id === counterId);
      if (cIndex !== -1) {
        closedCounters[cIndex] = { 
          ...closedCounters[cIndex], 
          status: 'CLOSED', 
          assignedWorkerId: null,
          isAvailable: true,
          queueLength: 0,
          estimatedWait: '--'
        };
      }

      const nextTeam = [...this.data.team];
      if (workerId) {
        const wIndex = nextTeam.findIndex(w => w.id === workerId);
        if (wIndex !== -1) {
          nextTeam[wIndex] = {
            ...nextTeam[wIndex],
            currentTask: null,
            taskProgress: 0,
            zone: 'Storewide' // reset to some neutral zone
          };
        }
      }

      this.data = { ...this.data, counters: closedCounters, team: nextTeam };
      this.notify();
    }, 2000);
  }
}

// Singleton instance
export const mockAdapterInstance = new MockIntelligenceAdapter();
