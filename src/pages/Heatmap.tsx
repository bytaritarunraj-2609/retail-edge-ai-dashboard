import React, { useState } from 'react';
import { Glass } from '../components/ui/Glass';
import { useIntelligence } from '../hooks/useIntelligence';
import { HeatmapStoreLayout } from '../components/heatmap/HeatmapStoreLayout';
import { HeatmapSummary } from '../components/heatmap/HeatmapSummary';
import { HeatmapZoneDrawer } from '../components/heatmap/HeatmapZoneDrawer';

export function Heatmap() {
  const data = useIntelligence();
  const [selectedShelfId, setSelectedShelfId] = useState<number | null>(null);

  if (!data || data.shelves.length === 0) {
    return <div style={{ padding: '24px' }}>Loading traffic heatmap...</div>;
  }

  const selectedShelf = data.shelves.find(s => s.id === selectedShelfId) || null;
  const activeZonesCount = data.shelves.filter(s => s.activityLevel !== 'LOW').length;
  const highActivityZones = data.shelves.filter(s => s.activityLevel === 'HIGH').length;
  
  // Find peak zone by sorting footfall or simply picking the first high activity
  const peakShelf = data.shelves.find(s => s.activityLevel === 'HIGH');
  const peakZone = peakShelf ? peakShelf.category : 'Storewide';
  
  // Simulate total footfall based on present metric
  const currentFootfall = Math.round(data.footfallPresent[data.footfallPresent.length - 1]?.v || 142);

  return (
    <div className="map-page">
      <div style={{ padding: '24px 24px 0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>SPATIAL TRAFFIC INTELLIGENCE</span>
            <h1 style={{ fontSize: '32px', margin: 0 }}>Heatmap</h1>
          </div>
          <span className="live-pill" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '11px', letterSpacing: '0.05em' }}>
            <i className="pulse-dot" /> SIMULATED EDGE AI
          </span>
        </div>

        <HeatmapSummary 
          currentFootfall={currentFootfall}
          activeZonesCount={activeZonesCount}
          highActivityZones={highActivityZones}
          peakZone={peakZone}
        />
      </div>

      <Glass className="map-shell" style={{ margin: '0 24px 24px 24px', flex: 1, minHeight: 0 }}>
        <HeatmapStoreLayout 
          shelves={data.shelves} 
          queue={data.queue}
          selectedShelfId={selectedShelfId} 
          onShelfClick={setSelectedShelfId} 
        />
      </Glass>

      <HeatmapZoneDrawer 
        shelf={selectedShelf}
        intensity={selectedShelf ? (selectedShelf.activityLevel === 'HIGH' ? 0.85 : selectedShelf.activityLevel === 'MEDIUM' ? 0.55 : 0.25) : 0}
        onClose={() => setSelectedShelfId(null)} 
      />
    </div>
  );
}
