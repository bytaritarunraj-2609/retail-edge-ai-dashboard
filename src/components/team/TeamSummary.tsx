import React from 'react';
import { TeamMember } from '../../types';
import { Users, UserCheck, CheckCircle2, ClipboardList, Timer } from 'lucide-react';
import { Glass } from '../ui/Glass';

interface TeamSummaryProps {
  team: TeamMember[];
}

export function TeamSummary({ team }: TeamSummaryProps) {
  const activeStaff = team.filter(m => m.status !== 'OFF SHIFT').length;
  const onFloor = team.filter(m => m.status === 'ON FLOOR').length;
  const tasksAssigned = team.filter(m => m.currentTask !== null).length;
  const tasksCompleted = team.reduce((acc, m) => acc + m.tasksCompleted, 0);

  // Calculate average response time purely for demo (e.g. "01:20")
  const validTimes = team.map(m => m.responseTime).filter(t => t !== '--');
  let avgStr = '--';
  if (validTimes.length > 0) {
    const totalSeconds = validTimes.reduce((acc, time) => {
      const [m, s] = time.split(':').map(Number);
      return acc + (m * 60) + s;
    }, 0);
    const avgSec = Math.floor(totalSeconds / validTimes.length);
    const m = Math.floor(avgSec / 60);
    const s = avgSec % 60;
    avgStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      <Glass style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Users size={18} className="text-cyan" />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Staff</span>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 300 }}>{activeStaff}</div>
      </Glass>
      
      <Glass style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <UserCheck size={18} className="text-green" />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>On Floor</span>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 300 }}>{onFloor}</div>
      </Glass>

      <Glass style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <ClipboardList size={18} className="text-orange" />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tasks Assigned</span>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 300 }}>{tasksAssigned}</div>
      </Glass>

      <Glass style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <CheckCircle2 size={18} className="text-purple" />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tasks Completed</span>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 300 }}>{tasksCompleted}</div>
      </Glass>

      <Glass style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Timer size={18} className="text-tertiary" />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Response</span>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 300 }}>{avgStr}</div>
      </Glass>
    </div>
  );
}
