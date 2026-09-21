import { useState, useEffect } from 'react';
import { DashboardData } from '../types';
import { mockAdapterInstance } from '../adapters/MockIntelligenceAdapter';

export function useIntelligence(): DashboardData | null {
  const [data, setData] = useState<DashboardData | null>(mockAdapterInstance.getDashboardData());

  useEffect(() => {
    // Initial set in case it updated before effect ran
    setData(mockAdapterInstance.getDashboardData());
    
    // Subscribe to any updates (e.g. from manager mutations or simulation ticks)
    const unsubscribe = mockAdapterInstance.subscribe(() => {
      setData(mockAdapterInstance.getDashboardData());
    });
    
    const interval = setInterval(() => {
      mockAdapterInstance.tickSimulation();
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return data;
}
