import React from 'react';
import { TeamMember, Shelf } from '../../types';
import { Glass } from '../ui/Glass';
import { Users } from 'lucide-react';

interface ZoneAssignmentsProps {
  team: TeamMember[];
  shelves: Shelf[];
}

export function ZoneAssignments({ team, shelves }: ZoneAssignmentsProps) {
  // Derive unique zones from shelves for realism, add some generics
  const allZones = Array.from(new Set(shelves.map(s => s.category)));
  if (!allZones.includes('Checkout')) allZones.push('Checkout');
  if (!allZones.includes('Back Stock')) allZones.push('Back Stock');

  return (
    <Glass style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '14px', marginBottom: '24px', color: 'var(--text-secondary)' }}>ZONE ASSIGNMENTS</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
        {allZones.sort().map(zone => {
          const staffInZone = team.filter(m => 
            m.zone.toLowerCase() === zone.toLowerCase() || 
            (m.zone === 'Storewide' && m.status === 'ON FLOOR')
          );
          const count = staffInZone.length;

          return (
            <div key={zone} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '4px',
              border: '1px solid var(--glass-border)'
            }}>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>{zone}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: count > 0 ? 'var(--color-cyan)' : 'var(--text-tertiary)' }}>
                <Users size={14} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{count}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Glass>
  );
}
