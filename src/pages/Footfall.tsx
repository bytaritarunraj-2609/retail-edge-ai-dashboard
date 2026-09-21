import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useIntelligence } from '../hooks/useIntelligence';
import { mockAdapterInstance } from '../adapters/MockIntelligenceAdapter';
import { FootfallSummary } from '../components/footfall/FootfallSummary';
import { FootfallChart } from '../components/footfall/FootfallChart';
import { QueueIntelligence } from '../components/footfall/QueueIntelligence';
import { CounterStatus } from '../components/footfall/CounterStatus';
import { ZoneTraffic } from '../components/footfall/ZoneTraffic';
import { TrafficTimeline } from '../components/footfall/TrafficTimeline';
import { DeployCounterDrawer } from '../components/shared/DeployCounterDrawer';
import { useAppSettings } from '../contexts/AppSettingsContext';

export function Footfall() {
  const data = useIntelligence();
  const [deployCounterId, setDeployCounterId] = useState<string | null>(null);
  
  if (!data) return <div style={{ padding: '24px' }}>Loading traffic intelligence...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.1, duration: 0.5, ease: [0.2, 0.9, 0.4, 1] }}
      style={{ padding: '24px 32px', height: '100%', overflowY: 'auto' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>RETAIL TRAFFIC + QUEUE INTELLIGENCE CONSOLE</span>
          <h1 style={{ fontSize: '32px', margin: 0 }}>Footfall</h1>
        </div>
        <span className="live-pill" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '11px', letterSpacing: '0.05em' }}>
          <i className="pulse-dot" /> SIMULATED EDGE AI / DEMO DATA
        </span>
      </div>

      <FootfallSummary />

      <div style={{ marginBottom: '24px' }}>
        <FootfallChart present={data.footfallPresent} day={data.footfallDay} week={data.footfallWeek} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px 300px', gap: '24px', minHeight: '350px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <QueueIntelligence 
            queue={data.queue} 
            onDeploy={() => setDeployCounterId(data.queue.recommendedCounterId)} 
          />
          <CounterStatus 
            counters={data.counters} 
            team={data.team} 
            onCloseCounter={(id) => mockAdapterInstance.closeCounter(id)} 
          />
        </div>

        <div>
          <ZoneTraffic shelves={data.shelves} />
        </div>

        <div>
          <TrafficTimeline queue={data.queue} />
        </div>

      </div>

      <DeployCounterDrawer 
        counter={data.counters.find(c => c.id === deployCounterId) || null} 
        team={data.team}
        onClose={() => setDeployCounterId(null)}
        onDeploy={(counterId, workerId) => mockAdapterInstance.deployCounter(counterId, workerId)}
      />

    </motion.div>
  );
}
