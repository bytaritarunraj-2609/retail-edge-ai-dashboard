import React from 'react';
import { Shelf } from '../../types';
import { InventoryRow } from './InventoryRow';

interface InventoryTableProps {
  shelves: Shelf[];
  onSelectShelf: (id: number) => void;
}

export function InventoryTable({ shelves, onSelectShelf }: InventoryTableProps) {
  if (shelves.length === 0) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ marginBottom: '16px', opacity: 0.5 }}>NO INVENTORY ISSUES</div>
        <p>All shelves currently meet their configured stock conditions.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-tertiary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
            <th style={{ padding: '12px 16px', fontWeight: 600 }}>Product</th>
            <th style={{ padding: '12px 16px', fontWeight: 600 }}>Category</th>
            <th style={{ padding: '12px 16px', fontWeight: 600 }}>Shelf</th>
            <th style={{ padding: '12px 16px', fontWeight: 600 }}>Camera</th>
            <th style={{ padding: '12px 16px', fontWeight: 600 }}>Current Stock</th>
            <th style={{ padding: '12px 16px', fontWeight: 600 }}>Last Scan</th>
          </tr>
        </thead>
        <tbody>
          {shelves.map(shelf => (
            <InventoryRow key={shelf.id} shelf={shelf} onClick={() => onSelectShelf(shelf.id)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
