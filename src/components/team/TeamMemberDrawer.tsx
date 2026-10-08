import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TeamMember, Action, Shelf } from '../../types';
import { Glass } from '../ui/Glass';
import { X, MapPin, Activity, CheckCircle2, ClipboardList, Timer } from 'lucide-react';
import { useAppSettings } from '../../contexts/AppSettingsContext';

interface TeamMemberDrawerProps {
  member: TeamMember | null;
  actions: Action[];
  shelves: Shelf[];
  onClose: () => void;
}

export function TeamMemberDrawer({ member, actions, shelves, onClose }: TeamMemberDrawerProps) {
  const { settings } = useAppSettings();

  if (!member) return null;

  const currentAction = actions.find(a => a.id === member.currentTask);
  const targetShelf = currentAction ? shelves.find(s => s.id === currentAction.shelfId) : null;

  const getStatusColor = (status: string) => {
    if (status === 'ON FLOOR') return 'var(--color-green)';
    if (status === 'BREAK') return 'var(--color-orange)';
    return 'var(--text-tertiary)';
  };

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
          width: '400px',
          maxWidth: '100vw',
          zIndex: 100,
          padding: '24px'
        }}
      >
        <Glass style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border-highlight)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '50%', 
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${getStatusColor(member.status)}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '20px',
                color: getStatusColor(member.status)
              }}>
                {member.initials}
              </div>
              <div>
                <h2 style={{ fontSize: '24px', margin: '0 0 4px 0' }}>{member.name}</h2>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>{member.role}</div>
                <span style={{ 
                  padding: '4px 8px', 
                  fontSize: '10px', 
                  fontWeight: 700, 
                  backgroundColor: `${getStatusColor(member.status)}20`,
                  color: getStatusColor(member.status),
                  borderRadius: '4px',
                  border: `1px solid ${getStatusColor(member.status)}40`
                }}>
                  {member.status}
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Glass style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Timer size={14} className="text-tertiary" />
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Response Time</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 300 }}>{member.responseTime}</div>
              </Glass>
              <Glass style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <CheckCircle2 size={14} className="text-green" />
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tasks Completed</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 300 }}>{member.tasksCompleted}</div>
              </Glass>
            </div>

            <div>
              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.05em' }}>Location & Status</h4>
              <Glass style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Current Zone</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={12} className="text-cyan" /> {member.zone}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Last Activity</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={12} className="text-tertiary" /> {member.lastActivity}
                  </span>
                </div>
              </Glass>
            </div>

            <div>
              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.05em' }}>Current Assignment</h4>
              {member.currentTask && currentAction ? (
                <Glass style={{ padding: '16px', borderLeft: '2px solid var(--color-cyan)' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <ClipboardList size={16} className="text-cyan" />
                    <b style={{ fontSize: '13px' }}>{currentAction.title}</b>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '24px', marginBottom: '16px' }}>
                    {currentAction.product} · {targetShelf?.zone || 'Unknown Zone'}
                  </div>
                  <div style={{ marginLeft: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Progress</span>
                      <span style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>{member.taskProgress}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                      <motion.div 
                        style={{ height: '100%', background: 'var(--color-cyan)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${member.taskProgress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </Glass>
              ) : (
                <Glass style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                  No active assignment.
                </Glass>
              )}
            </div>

          </div>

          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            {settings.role === 'MANAGER' ? 'Manager View: Full intelligence access granted.' : 'Worker View: Displaying operationally relevant data.'}
          </div>

        </Glass>
      </motion.div>
    </AnimatePresence>
  );
}
