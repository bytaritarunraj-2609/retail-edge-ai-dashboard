import { useState, useEffect } from 'react';
import { DashboardData } from '../types';
import { mockAdapterInstance } from '../adapters/MockIntelligenceAdapter';
import { liveAdapterInstance } from '../adapters/LiveIntelligenceAdapter';

export function useIntelligence(): DashboardData | null {
  const source = import.meta.env.VITE_INTELLIGENCE_SOURCE;
  const adapter = source === 'live-test' ? liveAdapterInstance : mockAdapterInstance;

  const [data, setData] = useState<DashboardData | null>(adapter.getDashboardData());

  useEffect(() => {
    // Initial set in case it updated before effect ran
    setData(adapter.getDashboardData());
    
    // Subscribe to any updates (e.g. from manager mutations or simulation ticks)
    const unsubscribe = adapter.subscribe(() => {
      setData(adapter.getDashboardData());
    });
    
    const interval = setInterval(() => {
      adapter.tickSimulation();
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [adapter]);

  return data;
}
