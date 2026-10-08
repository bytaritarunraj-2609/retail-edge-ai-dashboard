import React from 'react';
import { TeamMember } from '../../types';
import { Glass } from '../ui/Glass';
import { MapPin, Activity, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface TeamMemberCardProps {
  member: TeamMember;
  onClick: () => void;
}

export function TeamMemberCard({ member, onClick }: TeamMemberCardProps) {
  const getStatusColor = (status: string) => {
    if (status === 'ON FLOOR') return 'var(--color-green)';
    if (status === 'BREAK') return 'var(--color-orange)';
    return 'var(--text-tertiary)';
  };

  return (
    <motion.div whileHover={{ y: -2 }} onClick={onClick}>
      <Glass className="hover-glass" style={{ padding: '20px', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${getStatusColor(member.status)}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '14px',
              color: getStatusColor(member.status)
            }}>
              {member.initials}
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{member.name}</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{member.role}</div>
            </div>
          </div>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: `${getStatusColor(member.status)}20`,
            color: getStatusColor(member.status),
            border: `1px solid ${getStatusColor(member.status)}40`
          }}>
            {member.status}
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <MapPin size={14} className="text-tertiary" />
            {member.zone}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={14} className="text-tertiary" />
            {member.tasksCompleted} tasks completed
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <Activity size={14} className="text-tertiary" />
            {member.lastActivity}
          </div>
        </div>

        {member.currentTask && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Task</span>
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
        )}

      </Glass>
    </motion.div>
  );
}
