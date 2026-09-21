import React from 'react';
import { Shelf } from '../../types';
import { Package, HeartPulse, AlertTriangle, PackageX } from 'lucide-react';
import { Glass } from '../ui/Glass';

interface InventorySummaryProps {
  shelves: Shelf[];
}

export function InventorySummary({ shelves }: InventorySummaryProps) {
  const totalProducts = shelves.length;
  
  const outOfStockCount = shelves.filter(s => s.status === 'OUT_OF_STOCK').length;
  const restockCount = shelves.filter(s => s.status === 'RESTOCK').length;
  const misplacedCount = shelves.filter(s => s.status === 'MISPLACED').length;
  
  const issuesCount = outOfStockCount + restockCount + misplacedCount;
  const healthPercent = Math.round(((totalProducts - issuesCount) / totalProducts) * 100) || 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      <Glass style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Package size={18} className="text-cyan" />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Products</span>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 300 }}>{totalProducts}</div>
      </Glass>
      
      <Glass style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <HeartPulse size={18} className="text-green" />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock Health</span>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 300, color: healthPercent < 80 ? 'var(--color-orange)' : 'var(--text-primary)' }}>{healthPercent}%</div>
      </Glass>

      <Glass style={{ padding: '20px', cursor: 'pointer', transition: 'background 0.2s' }} className="hover-glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <AlertTriangle size={18} className="text-orange" />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Restock Required</span>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 300 }}>{restockCount}</div>
      </Glass>

      <Glass style={{ padding: '20px', cursor: 'pointer', transition: 'background 0.2s' }} className="hover-glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <PackageX size={18} className="text-red" />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Out of Stock</span>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 300 }}>{outOfStockCount}</div>
      </Glass>
    </div>
  );
}
