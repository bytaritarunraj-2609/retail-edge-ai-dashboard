import { DashboardData, ShelfState } from '../types';

export interface IntelligenceDataAdapter {
  getDashboardData(): DashboardData;
  subscribe(listener: () => void): () => void;
  updateShelfStatus(shelfId: number, status: ShelfState, isRectified: boolean): void;
  markNotificationRead(actionId: string): void;
  tickSimulation(): void;
  simulateScan(shelfId: number): void;
  deployCounter(counterId: string, workerId: string): void;
  closeCounter(counterId: string): void;
}
