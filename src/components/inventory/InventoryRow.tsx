import React from 'react';
import { Shelf } from '../../types';
import { StockMeter } from './StockMeter';
import { motion } from 'motion/react';
import { PackageCheck, PackageSearch, PackageX, AlertTriangle } from 'lucide-react';

interface InventoryRowProps {
  shelf: Shelf;
  onClick: () => void;
}

export function InventoryRow({ shelf, onClick }: InventoryRowProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NORMAL': return <PackageCheck size={14} className="text-green" />;
      case 'RESTOCK': return <AlertTriangle size={14} className="text-orange" />;
      case 'OUT_OF_STOCK': return <PackageX size={14} className="text-red" />;
      case 'MISPLACED': return <PackageSearch size={14} className="text-purple" />;
      default: return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'NORMAL': return 'status-normal';
      case 'RESTOCK': return 'status-warning';
      case 'OUT_OF_STOCK': return 'status-critical';
      case 'MISPLACED': return 'status-ai';
      default: return '';
    }
  };

  return (
    <motion.tr 
      onClick={onClick}
      className={`inventory-row ${getStatusClass(shelf.status)}`}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
      style={{ cursor: 'pointer', borderBottom: '1px solid var(--glass-border-highlight)' }}
    >
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getStatusIcon(shelf.status)}
          <span style={{ fontSize: '12px', fontWeight: 600 }}>{shelf.status.replace('_', ' ')}</span>
        </div>
      </td>
      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{shelf.product}</td>
      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{shelf.category}</td>
      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Shelf {String(shelf.id).padStart(2, '0')}</td>
      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Cam {String(shelf.cameraId).padStart(2, '0')}</td>
      <td style={{ padding: '12px 16px' }}>
        <StockMeter stock={shelf.stock} capacity={shelf.capacity} />
      </td>
      <td style={{ padding: '12px 16px', color: 'var(--text-tertiary)' }}>{shelf.lastScan}</td>
    </motion.tr>
  );
}
