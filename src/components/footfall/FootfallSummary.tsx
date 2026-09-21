import React from 'react';
import { Glass } from '../ui/Glass';
import { Users, Activity, Clock, TrendingUp } from 'lucide-react';

export function FootfallSummary() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      <Glass style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Users size={18} className="text-cyan" />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Footfall</span>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 300 }}>142</div>
      </Glass>
      
      <Glass style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <TrendingUp size={18} className="text-green" />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Visitors</span>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 300 }}>2,847</div>
      </Glass>

      <Glass style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Activity size={18} className="text-orange" />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peak Activity</span>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 300 }}>428 <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>@ 17:00</span></div>
      </Glass>

      <Glass style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Clock size={18} className="text-purple" />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Dwell Time</span>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 300 }}>04:12</div>
      </Glass>
    </div>
  );
}
