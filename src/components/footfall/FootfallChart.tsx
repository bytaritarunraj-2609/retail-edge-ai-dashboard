import React, { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'motion/react';
import { Glass } from '../ui/Glass';
import { FootfallMode, FootfallPoint } from '../../types';
import { useAppSettings } from '../../contexts/AppSettingsContext';

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
        {Math.round(payload[0].value)}
      </span>
    </div>
  );
};

interface FootfallChartProps {
  present: FootfallPoint[];
  day: FootfallPoint[];
  week: FootfallPoint[];
}

export function FootfallChart({ present, day, week }: FootfallChartProps) {
  const [mode, setMode] = useState<FootfallMode>('present');
  const activeDataset = mode === 'present' ? present : mode === 'day' ? day : week;

  return (
    <Glass style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-head" style={{ padding: '24px 24px 0 24px' }}>
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
      <div style={{ flex: 1, padding: '24px' }}>
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
  );
}
