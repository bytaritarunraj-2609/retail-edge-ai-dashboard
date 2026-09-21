import React from 'react';
import { QueueStatus } from '../../types';
import { Glass } from '../ui/Glass';
import { AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface QueueIntelligenceProps {
  queue: QueueStatus;
  onDeploy: () => void;
}

export function QueueIntelligence({ queue, onDeploy }: QueueIntelligenceProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'var(--color-red)';
      case 'HIGH': return 'var(--color-orange)';
      case 'ELEVATED': return 'var(--color-purple)';
      default: return 'var(--color-green)';
    }
  };

  const isAlert = queue.severity === 'HIGH' || queue.severity === 'CRITICAL';

  return (
    <Glass style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', borderLeft: isAlert ? `3px solid ${getSeverityColor(queue.severity)}` : 'none' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>QUEUE INTELLIGENCE</h3>
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          fontSize: '10px', 
          fontWeight: 700,
          background: `${getSeverityColor(queue.severity)}20`,
          color: getSeverityColor(queue.severity),
          border: `1px solid ${getSeverityColor(queue.severity)}40`
        }}>
          {queue.severity}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Queue Length</div>
          <div style={{ fontSize: '32px', fontWeight: 300, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <motion.span layout>{queue.queueLength}</motion.span>
            <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>customers</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Estimated Wait</div>
          <div style={{ fontSize: '32px', fontWeight: 300, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <motion.span layout>{Math.floor(queue.estimatedWait / 60)}:{String(queue.estimatedWait % 60).padStart(2, '0')}</motion.span>
            <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>min</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', padding: '16px 0' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>Growth Rate</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--color-orange)' }}>
            <TrendingUp size={14} /> {queue.growthRate}
          </div>
        </div>
        <div style={{ width: '1px', background: 'var(--glass-border)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>Active Counters</div>
          <div style={{ fontSize: '14px', fontWeight: 500 }}>
            {queue.activeCounterCount} / {queue.totalCounterCount}
          </div>
        </div>
      </div>

      {isAlert ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(255, 120, 0, 0.1)', border: '1px solid var(--color-orange)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '12px', color: 'var(--color-orange)' }}>
            <AlertTriangle size={18} />
            <div>
              <b style={{ fontSize: '13px' }}>OPEN COUNTER RECOMMENDED</b>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {queue.recommendationReason}
              </div>
            </div>
          </div>
          <button 
            className="btn-primary" 
            style={{ width: '100%', opacity: queue.recommendedCounterId ? 1 : 0.5 }}
            disabled={!queue.recommendedCounterId}
            onClick={onDeploy}
          >
            DEPLOY WORKER
          </button>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-green)', padding: '16px', background: 'rgba(0, 255, 100, 0.05)', borderRadius: '8px' }}>
          <CheckCircle2 size={16} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>QUEUE NORMAL</span>
        </div>
      )}

    </Glass>
  );
}
