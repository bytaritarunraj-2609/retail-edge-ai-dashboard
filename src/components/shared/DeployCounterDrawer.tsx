import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TeamMember, Counter } from '../../types';
import { Glass } from '../ui/Glass';
import { X, CheckCircle2 } from 'lucide-react';
import { useAppSettings } from '../../contexts/AppSettingsContext';

interface DeployCounterDrawerProps {
  counter: Counter | null;
  team: TeamMember[];
  onClose: () => void;
  onDeploy: (counterId: string, workerId: string) => void;
}

export function DeployCounterDrawer({ counter, team, onClose, onDeploy }: DeployCounterDrawerProps) {
  const { settings } = useAppSettings();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  if (!counter) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '450px',
          maxWidth: '100vw',
          zIndex: 100,
          padding: '24px'
        }}
      >
        <Glass style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border-highlight)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>DEPLOY TEAM MEMBER</span>
              <h2 style={{ fontSize: '20px', margin: '0 0 4px 0' }}>COUNTER 0{counter.number}</h2>
              <div style={{ color: 'var(--color-cyan)', fontSize: '13px' }}>NEW COUNTER ACTIVATION</div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {team.map(worker => {
              const isAvailable = worker.status === 'ON FLOOR' && worker.currentTask === null;
              const isSelected = selectedWorkerId === worker.id;

              return (
                <div 
                  key={worker.id}
                  onClick={() => {
                    if (isAvailable && settings.role === 'MANAGER') setSelectedWorkerId(worker.id);
                  }}
                  style={{ 
                    padding: '16px', 
                    background: isSelected ? 'rgba(0, 255, 255, 0.05)' : 'rgba(255,255,255,0.02)',
                    border: isSelected ? '1px solid var(--color-cyan)' : '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: (isAvailable && settings.role === 'MANAGER') ? 'pointer' : 'not-allowed',
                    opacity: isAvailable ? 1 : 0.5,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ 
                    width: '18px', 
                    height: '18px', 
                    borderRadius: '50%', 
                    border: isSelected ? 'none' : '1px solid var(--text-tertiary)',
                    background: isSelected ? 'var(--color-cyan)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000'
                  }}>
                    {isSelected && <CheckCircle2 size={14} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{worker.name}</span>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 700, 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        background: isAvailable ? 'var(--color-green)' : 'rgba(255,255,255,0.1)',
                        color: isAvailable ? '#000' : 'var(--text-tertiary)'
                      }}>
                        {isAvailable ? 'AVAILABLE' : 'BUSY'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{worker.role}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{worker.zone}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '24px', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
            {settings.role === 'MANAGER' ? (
              <button 
                disabled={!selectedWorkerId}
                onClick={() => {
                  if (selectedWorkerId) {
                    onDeploy(counter.id, selectedWorkerId);
                    onClose();
                  }
                }}
                className="btn-primary" 
                style={{ width: '100%', padding: '12px', opacity: selectedWorkerId ? 1 : 0.5, cursor: selectedWorkerId ? 'pointer' : 'not-allowed' }}
              >
                DEPLOY WORKER
              </button>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--color-orange)', textAlign: 'center' }}>
                Deploy action requires MANAGER privileges.
              </div>
            )}
          </div>

        </Glass>
      </motion.div>
    </AnimatePresence>
  );
}
