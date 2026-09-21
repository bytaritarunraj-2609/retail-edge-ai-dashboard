import React from 'react';
import { Glass } from '../ui/Glass';
import { Shelf } from '../../types';
import { MapPin } from 'lucide-react';

interface ZoneTrafficProps {
  shelves: Shelf[];
}

export function ZoneTraffic({ shelves }: ZoneTrafficProps) {
  // Aggregate mock zone traffic based on shelf data
  const zones = Array.from(new Set(shelves.map(s => s.category)));
  if (!zones.includes('Checkout')) zones.push('Checkout');
  
  const zoneData = zones.map(z => {
    // Fictional logic to map mock shelf data to zone metrics
    const relatedShelves = shelves.filter(s => s.category === z);
    const highAct = relatedShelves.some(s => s.activityLevel === 'HIGH');
    const medAct = relatedShelves.some(s => s.activityLevel === 'MEDIUM');
    
    let visitors = Math.floor(Math.random() * 200 + 50);
    let dwell = `0${Math.floor(Math.random() * 3 + 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
    let act = 'LOW';
    
    if (z === 'Checkout') {
      visitors += 100;
      act = 'HIGH';
      dwell = '02:06';
    } else if (highAct) {
      visitors += 150;
      act = 'HIGH';
      dwell = '05:12';
    } else if (medAct) {
      act = 'MEDIUM';
    }

    return { name: z, visitors, activity: act, dwell };
  });

  return (
    <Glass style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ fontSize: '14px', marginBottom: '24px', color: 'var(--text-secondary)' }}>ZONE TRAFFIC INTELLIGENCE</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
        {zoneData.map(zone => (
          <div key={zone.name} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '4px',
            border: '1px solid var(--glass-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={14} className="text-tertiary" />
              <span style={{ fontSize: '13px', fontWeight: 500 }}>{zone.name}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Visitors</div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{zone.visitors}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Dwell</div>
                <div style={{ fontSize: '13px' }}>{zone.dwell}</div>
              </div>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: 700, 
                width: '60px',
                textAlign: 'center',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: zone.activity === 'HIGH' ? 'rgba(0, 255, 255, 0.1)' : 
                                 zone.activity === 'MEDIUM' ? 'rgba(255, 255, 255, 0.1)' : 
                                 'rgba(255,255,255,0.05)',
                color: zone.activity === 'HIGH' ? 'var(--color-cyan)' : 'var(--text-secondary)'
              }}>
                {zone.activity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Glass>
  );
}
