import React from 'react';
import { Glass } from '../ui/Glass';
import { Users, Target, Zap, Activity } from 'lucide-react';
import { HeatmapLegend } from './HeatmapLegend';

interface HeatmapSummaryProps {
  currentFootfall: number;
  activeZonesCount: number;
  highActivityZones: number;
  peakZone: string;
}

export function HeatmapSummary({ currentFootfall, activeZonesCount, highActivityZones, peakZone }: HeatmapSummaryProps) {
  return (
    <Glass style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      
      <div style={{ display: 'flex', gap: '48px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <Users size={16} className="text-cyan" />
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Footfall</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 300 }}>{currentFootfall}</div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <Target size={16} className="text-green" />
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Zones</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 300 }}>{activeZonesCount} / 20</div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <Zap size={16} className="text-orange" />
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>High Activity</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 300 }}>{highActivityZones} <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>zones</span></div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <Activity size={16} className="text-red" />
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peak Zone</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 300 }}>{peakZone}</div>
        </div>
      </div>

      <HeatmapLegend />

    </Glass>
  );
}
