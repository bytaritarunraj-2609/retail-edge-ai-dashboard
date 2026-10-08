import React from 'react';

export function HeatmapLegend() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '250px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', letterSpacing: '0.05em', fontWeight: 600 }}>
        <span>LOW</span>
        <span>ACTIVITY DENSITY</span>
        <span>HIGH</span>
      </div>
      <div style={{ 
        height: '8px', 
        width: '100%', 
        borderRadius: '4px',
        background: 'linear-gradient(to right, rgba(30,58,138,0.2), #1e3a8a, #3b82f6, #a855f7, #ef4444, #f97316, #eab308)',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-tertiary)' }}>
        <span style={{ width: '20%', textAlign: 'left' }}>0.0</span>
        <span style={{ width: '20%', textAlign: 'center' }}>0.2</span>
        <span style={{ width: '20%', textAlign: 'center' }}>0.5</span>
        <span style={{ width: '20%', textAlign: 'center' }}>0.8</span>
        <span style={{ width: '20%', textAlign: 'right' }}>1.0</span>
      </div>
    </div>
  );
}
