import React from 'react';

interface StockMeterProps {
  stock: number;
  capacity: number;
}

export function StockMeter({ stock, capacity }: StockMeterProps) {
  const percentage = Math.max(0, Math.min(100, Math.round((stock / capacity) * 100)));
  
  let colorClass = 'var(--color-green)';
  if (percentage === 0) colorClass = 'var(--color-red)';
  else if (percentage <= 20) colorClass = 'var(--color-orange)';

  const blocks = 8;
  const filledBlocks = Math.round((percentage / 100) * blocks);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: '11px', width: '45px' }}>
        {String(stock).padStart(2, '0')}/{capacity}
      </span>
      <div style={{ display: 'flex', gap: '2px' }}>
        {Array.from({ length: blocks }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '5px',
              height: '10px',
              backgroundColor: i < filledBlocks ? colorClass : 'var(--glass-border)',
              borderRadius: '1px',
              transition: 'background-color 0.3s ease'
            }}
          />
        ))}
      </div>
      <span style={{ color: colorClass, fontSize: '11px', fontWeight: 600, width: '35px', textAlign: 'right' }}>
        {percentage}%
      </span>
    </div>
  );
}
