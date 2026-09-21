import { motion } from 'motion/react';
import { CircleDot } from 'lucide-react';
import { Tone } from '../../types';

interface MetricCardProps {
  item: [string, string, string, Tone];
  index: number;
}

export function MetricCard({ item, index }: MetricCardProps) {
  return (
    <motion.div
      className="metric glass"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <div className="metric-top">
        <span>{item[0]}</span>
        <CircleDot size={13} />
      </div>
      <div className="metric-value">{item[1]}</div>
      <div className={'metric-trend ' + (item[3] === 'critical' ? 'bad' : '')}>
        {item[2]}
      </div>
      <div className="reflection" />
    </motion.div>
  );
}
