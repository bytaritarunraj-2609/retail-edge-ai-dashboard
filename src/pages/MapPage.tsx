import React from 'react';
import { Glass } from '../components/ui/Glass';
import { useIntelligence } from '../hooks/useIntelligence';
import { useCameraScheduler } from '../hooks/useCameraScheduler';
import { StoreMap } from '../components/store-map/StoreMap';
import { CameraResourceSummary } from '../components/store-map/CameraResourceSummary';
import { ShelfDetailDrawer } from '../components/store-map/ShelfDetailDrawer';
import { useAppSettings } from '../contexts/AppSettingsContext';

export function MapPage() {
  const data = useIntelligence();
  const { selectedShelfId, setSelectedShelfId } = useAppSettings();

  // useCameraScheduler handles the deterministic rotation and simulated lifecycle
  const { cameras, shelves, activeCameraIds, nextCameraIds } = useCameraScheduler(
    data?.shelves || [],
    data?.cameras || []
  );

  if (!data || shelves.length === 0) {
    return <div>Loading map data...</div>;
  }

  const selectedShelf = shelves.find(s => s.id === selectedShelfId) || null;
  const selectedCamera = cameras.find(c => c.id === selectedShelf?.cameraId) || null;

  return (
    <div className="map-page">
      <Glass className="map-shell">
        <div className="panel-head">
          <div>
            <span className="eyebrow">DIGITAL STORE TWIN</span>
            <h2>Store map</h2>
          </div>
          <CameraResourceSummary 
            activeCameraIds={activeCameraIds} 
            nextCameraIds={nextCameraIds} 
            totalCameras={cameras.length} 
          />
        </div>
        
        <StoreMap 
          shelves={shelves} 
          cameras={cameras} 
          selectedShelfId={selectedShelfId} 
          onShelfClick={setSelectedShelfId} 
        />
      </Glass>

      <ShelfDetailDrawer 
        shelf={selectedShelf} 
        camera={selectedCamera} 
        onClose={() => setSelectedShelfId(null)} 
      />
    </div>
  );
}
