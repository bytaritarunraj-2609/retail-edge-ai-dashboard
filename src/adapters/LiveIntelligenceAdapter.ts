import { IntelligenceDataAdapter } from './IntelligenceDataAdapter';
import { DashboardData, ShelfState, ActivityLevel } from '../types';
import { mockAdapterInstance } from './MockIntelligenceAdapter';
import aiTelemetryData from '../../ai/outputs/retail_intelligence_test.json';

// Provide a safe fallback if import somehow fails
let aiTelemetry: any = aiTelemetryData;
if (!aiTelemetry) {
  console.warn("AI Telemetry not found. Falling back to mock data.");
}

export class LiveIntelligenceAdapter implements IntelligenceDataAdapter {
  getDashboardData(): DashboardData {
    const baseData = mockAdapterInstance.getDashboardData();
    
    if (!aiTelemetry) {
      return baseData;
    }

    // 1. Map Footfall
    const footfallDay = [...baseData.footfallDay];
    if (aiTelemetry.summary?.observedUniqueVisitors !== undefined) {
      // Modify the last point to reflect the test video telemetry
      footfallDay[footfallDay.length - 1] = {
        ...footfallDay[footfallDay.length - 1],
        v: aiTelemetry.summary.observedUniqueVisitors,
        displayTime: 'TEST'
      };
    }
    
    // 2. Map Zone Activity -> Shelves/Zones
    const shelves = baseData.shelves.map(shelf => {
      // The AI telemetry uses "Zone 01" to "Zone 20", matching the shelf.zone exactly.
      // E.g., shelf.zone is "Zone 01" or "Checkout", AI provides "Zone 01"
      const aiZone = aiTelemetry.zones?.find((z: any) => z.zoneName === shelf.zone || z.zoneId === shelf.zone);
      
      if (aiZone) {
        return {
          ...shelf,
          activityLevel: aiZone.activityLevel as ActivityLevel,
          trackCount: aiZone.uniqueVisitors,
          detectionCount: aiZone.entries,
          // Note: we DO NOT overwrite inventory/stock here (Inventory Safety rule)
        };
      }
      return shelf;
    });

    return {
      ...baseData,
      footfallDay,
      shelves
    };
  }

  subscribe(listener: () => void): () => void {
    return mockAdapterInstance.subscribe(listener);
  }

  updateShelfStatus(shelfId: number, status: ShelfState, isRectified: boolean): void {
    mockAdapterInstance.updateShelfStatus(shelfId, status, isRectified);
  }

  markNotificationRead(actionId: string): void {
    mockAdapterInstance.markNotificationRead(actionId);
  }

  simulateScan(shelfId: number): void {
    mockAdapterInstance.simulateScan(shelfId);
  }

  tickSimulation(): void {
    // We still tick the simulation for team/queue/mock footfall
    mockAdapterInstance.tickSimulation();
  }

  deployCounter(counterId: string, workerId: string): void {
    mockAdapterInstance.deployCounter(counterId, workerId);
  }

  closeCounter(counterId: string): void {
    mockAdapterInstance.closeCounter(counterId);
  }
}

export const liveAdapterInstance = new LiveIntelligenceAdapter();
