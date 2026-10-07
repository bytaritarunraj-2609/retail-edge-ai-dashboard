import { useState, useEffect, useMemo } from 'react';
import { Camera, CameraState, Shelf } from '../types';
import { mockAdapterInstance } from '../adapters/MockIntelligenceAdapter';

export function useCameraScheduler(initialShelves: Shelf[], initialCameras: Camera[]) {
  const [shelves, setShelves] = useState<Shelf[]>(initialShelves);
  
  useEffect(() => {
    setShelves(initialShelves);
  }, [initialShelves]);
  
  // Sort priority for camera rotation based on activity level.
  const priorityMap: Record<string, number> = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
  
  // Create an ordered list of shelf IDs to cycle through
  const orderedShelfIds = useMemo(() => {
    return [...initialShelves].sort((a, b) => {
      if (priorityMap[a.activityLevel] !== priorityMap[b.activityLevel]) {
        return priorityMap[b.activityLevel] - priorityMap[a.activityLevel];
      }
      return a.id - b.id; // Deterministic tie-breaker
    }).map(s => s.id);
  }, [initialShelves]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [cycleStage, setCycleStage] = useState<CameraState>('QUEUED');

  const activeShelfIds = useMemo(() => {
    return orderedShelfIds.slice(currentIndex, currentIndex + 4);
  }, [currentIndex, orderedShelfIds]);

  const nextShelfIds = useMemo(() => {
    const nextIdx = (currentIndex + 4) % orderedShelfIds.length;
    return orderedShelfIds.slice(nextIdx, nextIdx + 4);
  }, [currentIndex, orderedShelfIds]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    // States: QUEUED -> PROCESSING -> CAPTURING -> ANALYZING -> COMPLETE -> (switch to next 4) QUEUED
    const getNextStateAndDelay = (state: CameraState): [CameraState, number] => {
      switch (state) {
        case 'INACTIVE': return ['QUEUED', 500];
        case 'QUEUED': return ['PROCESSING', 800];
        case 'PROCESSING': return ['CAPTURING', 1000];
        case 'CAPTURING': return ['ANALYZING', 1500];
        case 'ANALYZING': return ['COMPLETE', 1500];
        case 'COMPLETE': return ['QUEUED', 1000];
        default: return ['QUEUED', 1000];
      }
    };

    const [nextState, delay] = getNextStateAndDelay(cycleStage);

    timer = setTimeout(() => {
      if (cycleStage === 'COMPLETE') {
        // Move to next 4 cameras
        setCurrentIndex(prev => (prev + 4) % orderedShelfIds.length);
        
        // When transitioning out of COMPLETE, we can simulate an inventory scan update
        // We'll update the lastScan time for the *currently completing* shelves via adapter
        activeShelfIds.forEach(id => {
          mockAdapterInstance.simulateScan(id);
        });
      }
      setCycleStage(nextState);
    }, delay);

    return () => clearTimeout(timer);
  }, [cycleStage, currentIndex, orderedShelfIds, activeShelfIds]);

  // Sync cameras state
  const liveCameras = useMemo(() => {
    return initialCameras.map(cam => {
      const isCurrentlyActive = activeShelfIds.includes(cam.id);
      return {
        ...cam,
        state: isCurrentlyActive ? cycleStage : 'INACTIVE'
      };
    });
  }, [initialCameras, activeShelfIds, cycleStage]);

  return {
    cameras: liveCameras,
    shelves,
    activeCameraIds: activeShelfIds,
    nextCameraIds: nextShelfIds
  };
}
