import React from 'react';
import { Glass } from '../ui/Glass';
import { QueueStatus } from '../../types';

interface TrafficTimelineProps {
  queue: QueueStatus;
}

export function TrafficTimeline({ queue }: TrafficTimelineProps) {
  // Generate some realistic looking simulated timeline items based on queue state
  const timeline = [
    { time: '14:32', event: 'Footfall increased steadily' },
    { time: '14:35', event: 'Beverages → HIGH activity' },
    { time: '14:39', event: 'Checkout activity increased' }
  ];

  if (queue.severity === 'ELEVATED') {
    timeline.push({ time: 'Just now', event: 'Queue threshold approaching' });
  } else if (queue.severity === 'HIGH' || queue.severity === 'CRITICAL') {
    timeline.push({ time: queue.lastUpdated, event: `Queue threshold exceeded (${queue.queueLength} customers)` });
    if (queue.recommendedCounterId) {
      timeline.push({ time: 'Just now', event: `Counter ${queue.recommendedCounterId.replace('C-0', '')} deployment recommended` });
    }
  } else if (queue.severity === 'NORMAL' && queue.activeCounterCount === 4) {
    timeline.push({ time: 'Just now', event: 'Queue activity decreasing' });
    timeline.push({ time: 'Just now', event: 'Wait times returned to normal' });
  }

  return (
    <Glass style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ fontSize: '14px', marginBottom: '24px', color: 'var(--text-secondary)' }}>TRAFFIC TIMELINE</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
        {timeline.reverse().map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '48px', fontSize: '11px', color: 'var(--text-tertiary)', paddingTop: '2px' }}>
              {item.time}
            </div>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: i === 0 ? 'var(--color-cyan)' : 'var(--glass-border-highlight)',
              marginTop: '5px',
              boxShadow: i === 0 ? '0 0 8px var(--color-cyan)' : 'none'
            }} />
            <div style={{ flex: 1, fontSize: '13px', color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {item.event}
            </div>
          </div>
        ))}
      </div>
    </Glass>
  );
}
