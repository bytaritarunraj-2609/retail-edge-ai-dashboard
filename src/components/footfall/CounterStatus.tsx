import React from 'react';
import { Counter, TeamMember } from '../../types';
import { Glass } from '../ui/Glass';
import { User, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppSettings } from '../../contexts/AppSettingsContext';

interface CounterStatusProps {
  counters: Counter[];
  team: TeamMember[];
  onCloseCounter: (id: string) => void;
}

export function CounterStatus({ counters, team, onCloseCounter }: CounterStatusProps) {
  const { settings } = useAppSettings();

  return (
    <Glass style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ fontSize: '14px', marginBottom: '24px', color: 'var(--text-secondary)' }}>COUNTER STATUS</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', overflowY: 'auto' }}>
        {counters.map(counter => {
          const assignee = team.find(w => w.id === counter.assignedWorkerId);
          
          return (
            <motion.div 
              layout
              key={counter.id} 
              style={{ 
                padding: '16px', 
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                borderTop: counter.status === 'ACTIVE' ? '2px solid var(--color-cyan)' : 
                           counter.status === 'OPENING' ? '2px solid var(--color-orange)' : 
                           '2px solid transparent'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <b style={{ fontSize: '14px' }}>COUNTER 0{counter.number}</b>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: 700, 
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: counter.status === 'ACTIVE' ? 'rgba(0, 255, 255, 0.1)' : 
                                   counter.status === 'OPENING' || counter.status === 'CLOSING' ? 'rgba(255, 120, 0, 0.1)' : 
                                   'rgba(255,255,255,0.05)',
                  color: counter.status === 'ACTIVE' ? 'var(--color-cyan)' : 
                         counter.status === 'OPENING' || counter.status === 'CLOSING' ? 'var(--color-orange)' : 
                         'var(--text-tertiary)'
                }}>
                  {counter.status}
                </span>
              </div>

              {counter.status === 'ACTIVE' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>{counter.queueLength} customers</div>
                    <div style={{ fontWeight: 600 }}>{counter.estimatedWait} wait</div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <User size={14} className="text-tertiary" />
                      <span style={{ color: 'var(--text-secondary)' }}>{assignee?.name || 'Unknown'}</span>
                    </div>
                    {settings.role === 'MANAGER' && (
                      <button 
                        onClick={() => onCloseCounter(counter.id)}
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          color: 'var(--text-tertiary)', 
                          fontSize: '11px', 
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        CLOSE
                      </button>
                    )}
                  </div>
                </>
              ) : counter.status === 'OPENING' || counter.status === 'CLOSING' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0', color: 'var(--color-orange)', gap: '8px' }}>
                  <Loader2 size={16} className="spin" />
                  <span style={{ fontSize: '12px' }}>{counter.status === 'OPENING' ? 'Preparing station...' : 'Closing station...'}</span>
                  {assignee && <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{assignee.name} assigned</span>}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                  Available for deployment
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </Glass>
  );
}
