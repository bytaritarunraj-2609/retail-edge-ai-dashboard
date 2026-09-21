import React from 'react';
import { Action, TeamMember, Shelf } from '../../types';
import { Glass } from '../ui/Glass';
import { PackageX, AlertTriangle, PackageSearch } from 'lucide-react';

interface TeamTaskPanelProps {
  actions: Action[];
  team: TeamMember[];
  shelves: Shelf[];
}

export function TeamTaskPanel({ actions, team, shelves }: TeamTaskPanelProps) {
  const getSeverityColor = (tone: string) => {
    switch(tone) {
      case 'critical': return 'var(--color-red)';
      case 'warning': return 'var(--color-orange)';
      case 'ai': return 'var(--color-purple)';
      default: return 'var(--color-cyan)';
    }
  };

  const getIcon = (tone: string) => {
    switch(tone) {
      case 'critical': return <PackageX size={16} className="text-red" />;
      case 'warning': return <AlertTriangle size={16} className="text-orange" />;
      case 'ai': return <PackageSearch size={16} className="text-purple" />;
      default: return <AlertTriangle size={16} className="text-cyan" />;
    }
  };

  const activeActions = actions.filter(a => a.status !== 'COMPLETED');

  if (activeActions.length === 0) {
    return (
      <Glass style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-secondary)' }}>ACTIVE TASKS</h3>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '12px' }}>
          No active tasks assigned to floor staff.
        </div>
      </Glass>
    );
  }

  return (
    <Glass style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '14px', marginBottom: '24px', color: 'var(--text-secondary)' }}>ACTIVE TASKS</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
        {activeActions.map(action => {
          // Find if anyone is working on it
          const assignee = team.find(m => m.currentTask === action.id);
          const shelf = shelves.find(s => s.id === action.shelfId);

          return (
            <div key={action.id} style={{ 
              padding: '16px', 
              background: 'rgba(0,0,0,0.2)', 
              borderRadius: '8px',
              borderLeft: `2px solid ${getSeverityColor(action.tone)}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {getIcon(action.tone)}
                  <b style={{ fontSize: '13px' }}>{action.title}</b>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{action.time}</span>
              </div>
              
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                {action.product} {shelf ? `· ${shelf.zone}` : ''}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <span style={{ color: assignee ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  {assignee ? `Assigned to ${assignee.name}` : 'Unassigned'}
                </span>
                <span style={{ 
                  padding: '2px 6px', 
                  borderRadius: '2px', 
                  background: action.status === 'COMPLETING' ? 'var(--color-green)' : 'rgba(255,255,255,0.05)',
                  color: action.status === 'COMPLETING' ? '#000' : 'var(--text-secondary)'
                }}>
                  {action.status === 'COMPLETING' ? 'COMPLETING' : assignee ? 'IN PROGRESS' : 'PENDING'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Glass>
  );
}
