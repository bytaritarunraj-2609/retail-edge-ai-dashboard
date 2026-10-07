import React, { useState, useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Camera, Command, Activity, ChevronRight, AlertTriangle, PackageX, PackageSearch, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence, useSpring } from 'motion/react';
import { Glass } from '../components/ui/Glass';
import { MetricCard } from '../components/ui/MetricCard';
import { FootfallMode } from '../types';
import { useIntelligence } from '../hooks/useIntelligence';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { DeployCounterDrawer } from '../components/shared/DeployCounterDrawer';
import { mockAdapterInstance } from '../adapters/MockIntelligenceAdapter';
const AnimatedDot = (props: any) => {
  const { cx, cy, stroke } = props;
  const { settings: { motion: motionSetting } } = useAppSettings();
  
  if (motionSetting === 'reduced') {
    return <circle cx={cx} cy={cy} r={4} stroke={stroke} fill="var(--glass-surface-l3)" strokeWidth={2} />;
  }
  
  return (
    <motion.circle
      initial={{ cx, cy }}
      animate={{ cx, cy }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      r={4}
      stroke={stroke}
      fill="var(--glass-surface-l3)"
      strokeWidth={2}
    />
  );
};

const AnimatedCursor = (props: any) => {
  const { points } = props;
  const { settings: { motion: motionSetting } } = useAppSettings();
  const x = points?.[0]?.x;
  
  if (!x) return null;
  
  if (motionSetting === 'reduced') {
    return (
      <line
        x1={x} y1={0} x2={x} y2={1000}
        stroke="var(--glass-border-highlight)"
        strokeDasharray="3 3"
        opacity={0.5}
      />
    );
  }

  return (
    <motion.line
      initial={{ x1: x, x2: x }}
      animate={{ x1: x, x2: x }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      y1={0}
      y2={1000}
      stroke="var(--glass-border-highlight)"
      strokeDasharray="3 3"
      opacity={0.5}
    />
  );
};

const AnimatedValue = ({ value }: { value: number }) => {
  const { settings: { motion: motionSetting } } = useAppSettings();
  const springValue = useSpring(value, { damping: 25, stiffness: 250 });
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (motionSetting === 'reduced') {
      setDisplayValue(value);
      return;
    }
    
    // Subscribe to spring changes to update the display text smoothly
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(Math.round(latest));
    });
    
    // Set the target for the spring
    springValue.set(value);
    
    return () => unsubscribe();
  }, [value, springValue, motionSetting]);

  return <span>{displayValue}</span>;
};

const AnimatedTooltip = (props: any) => {
  const { active, payload } = props;
  
  if (!active || !payload || !payload.length) return null;
  
  const point = payload[0].payload;
  
  return (
    <div style={{
      background: 'var(--glass-surface-l3)', 
      border: '1px solid var(--glass-border-highlight)', 
      borderRadius: 'var(--radius-sm)', 
      backdropFilter: 'blur(16px)',
      color: 'var(--text-primary)',
      padding: '8px 12px',
      fontSize: '12px',
      fontWeight: 600,
      boxShadow: 'var(--glass-shadow)',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    }}>
      <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>{point.displayTime}</span>
      <span style={{ color: 'var(--color-cyan)', fontSize: '14px' }}>
        <AnimatedValue value={payload[0].value} />
      </span>
    </div>
  );
};

export function Overview() {
  const data = useIntelligence();
  const [selected, setSelected] = useState<number | null>(null);
  const [demoTick, setDemoTick] = useState(0);
  const [mode, setMode] = useState<FootfallMode>('present');
  const [deployCounterId, setDeployCounterId] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setDemoTick(x => x + 1), 5000);
    return () => clearInterval(id);
  }, []);

  if (!data) {
    return <div>Loading intelligence data...</div>;
  }

  const { footfallPresent, footfallDay, footfallWeek, actions, cameras, kpis } = data;
  const activeCam = demoTick % 20;

  const activeDataset = mode === 'present' ? footfallPresent : mode === 'day' ? footfallDay : footfallWeek;

  const getActionIcon = (title: string, status: string) => {
    if (status === 'COMPLETED') return <CheckCircle2 size={14} className="text-green" />;
    if (status === 'COMPLETING') return <CheckCircle2 size={14} className="text-cyan" style={{ animation: 'pulse 1s infinite' }} />;
    if (title.includes('OUT OF STOCK')) return <PackageX size={14} />;
    if (title.includes('RESTOCK')) return <AlertTriangle size={14} />;
    if (title.includes('MISPLACED')) return <PackageSearch size={14} />;
    return <AlertTriangle size={14} />;
  };

  const getActionClass = (tone: string, status: string) => {
    if (status === 'COMPLETED' || status === 'COMPLETING') return 'action-completed';
    switch(tone) {
      case 'critical': return 'action-critical';
      case 'warning': return 'action-warning';
      case 'ai': return 'action-ai';
      default: return 'action-normal';
    }
  };

  // Only show non-completed actions in the counter
  const openActionsCount = actions.filter(a => a.status !== 'COMPLETED').length;

  return (
    <div className="page-grid">
      <div className="metrics">
        {kpis.map((x, i) => (
          <MetricCard item={x} index={i} key={i} />
        ))}
      </div>
      
      <div className="content-grid">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, ease: [0.2, 0.9, 0.4, 1] }} style={{ height: '100%', display: 'flex' }}>
          <Glass className="chart-card">
            <div className="panel-head">
              <div>
                <span className="eyebrow">TRAFFIC INTELLIGENCE</span>
                <h2>Store footfall</h2>
              </div>
              <div className="seg">
                <button className={mode === 'present' ? 'selected' : ''} onClick={() => setMode('present')}>Present</button>
                <button className={mode === 'day' ? 'selected' : ''} onClick={() => setMode('day')}>Day</button>
                <button className={mode === 'week' ? 'selected' : ''} onClick={() => setMode('week')}>Week</button>
              </div>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeDataset} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="foot" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="var(--color-cyan)" stopOpacity={0.4} />
                      <stop offset="1" stopColor="var(--color-cyan)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--glass-border-highlight)" vertical={false} strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="t" 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    stroke="var(--text-tertiary)" 
                    tick={{ fontSize: 10, fontWeight: 500 }} 
                    tickFormatter={(val) => {
                      if (mode === 'week') {
                        const d = new Date(val);
                        return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
                      }
                      return new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }}
                    tickLine={false} 
                    axisLine={false} 
                    dy={10} 
                  />
                  <YAxis stroke="var(--text-tertiary)" tick={{ fontSize: 10, fontWeight: 500 }} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    cursor={<AnimatedCursor />}
                    content={<AnimatedTooltip />}
                    isAnimationActive={true}
                    animationDuration={300}
                    animationEasing="ease-out"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="v" 
                    stroke="var(--color-cyan)" 
                    strokeWidth={2.5} 
                    fill="url(#foot)" 
                    isAnimationActive={false} 
                    activeDot={<AnimatedDot />}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Glass>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5, ease: [0.2, 0.9, 0.4, 1] }} style={{ height: '100%', display: 'flex' }}>
          <Glass className="ai-card">
            <div className="panel-head">
              <div>
                <span className="eyebrow">EDGE AI ACTIVITY</span>
                <h2>Live pipeline</h2>
              </div>
              <span className="live-pill">
                <i className="pulse-dot" /> SIMULATED
              </span>
            </div>
            
            <div className="pipeline">
              <div className="pipeline-node active">
                <Camera />
                <span>CAM {String((activeCam % 20) + 1).padStart(2, '0')}</span>
              </div>
              <div className="pipe-line flow-active" />
              <div className="pipeline-node active">
                <Command />
                <span>YOLO11n</span>
              </div>
              <div className="pipe-line flow-active delay-1" />
              <div className="pipeline-node active delay-2">
                <Activity />
                <span>ByteTrack</span>
              </div>
            </div>
            
            <div className="ai-reading">
              <div>
                <small>FRAME ACQUIRED</small>
                <b>{11 + (activeCam % 7)} DETECTIONS</b>
              </div>
              <div>
                <small>TRACKING</small>
                <b>{5 + (activeCam % 4)} TRACKS</b>
              </div>
              <div>
                <small>RESOURCE WINDOW</small>
                <b>4 / 20 ACTIVE</b>
              </div>
            </div>
            
            <div className="ai-log">
              <span>ANALYSIS COMPLETE</span>
              <span className="divider">·</span>
              <span>ZONE {String((activeCam % 20) + 1).padStart(2, '0')}</span>
              <span className="divider">·</span>
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </Glass>
        </motion.div>


        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5, ease: [0.2, 0.9, 0.4, 1] }} className="actions-wrapper">
          
          {data.queue.severity === 'HIGH' || data.queue.severity === 'CRITICAL' ? (
            <Glass className="actions-card" style={{ marginBottom: '16px', borderLeft: '3px solid var(--color-orange)', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--color-orange)' }}>
                  <AlertTriangle size={18} />
                  <b style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>QUEUE BUILDUP DETECTED</b>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{data.queue.lastUpdated}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Checkout queue</div>
                  <div style={{ fontSize: '20px', fontWeight: 600 }}>{data.queue.queueLength} customers</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Estimated wait</div>
                  <div style={{ fontSize: '20px', fontWeight: 600 }}>
                    {Math.floor(data.queue.estimatedWait / 60)}:{String(data.queue.estimatedWait % 60).padStart(2, '0')}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Active counters: {data.queue.activeCounterCount} / {data.queue.totalCounterCount}
                </span>
                <button 
                  className="btn-primary" 
                  onClick={() => setDeployCounterId(data.queue.recommendedCounterId)}
                  disabled={!data.queue.recommendedCounterId}
                  style={{ opacity: data.queue.recommendedCounterId ? 1 : 0.5 }}
                >
                  OPEN NEW COUNTER
                </button>
              </div>
            </Glass>
          ) : (
            <Glass className="actions-card" style={{ marginBottom: '16px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <CheckCircle2 size={18} className="text-green" />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>QUEUE NORMAL</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {data.queue.activeCounterCount} / {data.queue.totalCounterCount} COUNTERS ACTIVE
              </span>
            </Glass>
          )}

          <Glass className="actions-card" style={{ flex: 1, minHeight: 0 }}>
            <div className="panel-head">
              <div>
                <span className="eyebrow">OPERATIONS</span>
                <h2>Actions required</h2>
              </div>
              <span className="count-pill">{openActionsCount} OPEN</span>
            </div>
            <div className="actions-list">
              <AnimatePresence>
                {actions.map((a, i) => (
                  <motion.button 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`action-row ${getActionClass(a.tone, a.status)}`} 
                    key={a.id} 
                    onClick={() => setSelected(i)}
                  >
                    <div className="action-icon">
                      {getActionIcon(a.title, a.status)}
                    </div>
                    <div className="action-main">
                      <b style={{ textDecoration: a.status === 'COMPLETING' || a.status === 'COMPLETED' ? 'line-through' : 'none', opacity: a.status === 'COMPLETING' ? 0.6 : 1 }}>{a.title}</b>
                      <span>{a.product} <span className="dot">·</span> {a.reason}</span>
                    </div>
                    <div className="action-meta">
                      <span className="location">{a.camera}</span>
                      <small>{a.time}</small>
                    </div>
                    <div className="action-arrow">
                      <ChevronRight size={16} />
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </Glass>
        </motion.div>
      </div>

      <AnimatePresence>
        {selected !== null && (
          <motion.div
            className="detail-dock glass"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div>
              <span className="eyebrow">SELECTED INTELLIGENCE</span>
              <h3>{selected < 20 && !actions[selected] ? `CAM ${String(selected + 1).padStart(2, '0')}` : 'ACTION'}</h3>
            </div>
            <div className="dock-detail">
              {selected < 20 && !actions[selected] ? (
                <>
                  <span>{cameras[selected]?.zone}</span>
                  <span>{cameras[selected]?.state}</span>
                  <span>People: {18 + ((selected * 3) % 29)}</span>
                  <span>Detections: {9 + ((selected * 2) % 11)}</span>
                </>
              ) : (
                <span>{actions[selected]?.product} - {actions[selected]?.status}</span>
              )}
            </div>
            <button className="close" onClick={() => setSelected(null)}>
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <DeployCounterDrawer 
        counter={data.counters.find(c => c.id === deployCounterId) || null} 
        team={data.team}
        onClose={() => setDeployCounterId(null)}
        onDeploy={(counterId, workerId) => mockAdapterInstance.deployCounter(counterId, workerId)}
      />
    </div>
  );
}
