import React from 'react';
import { Glass } from '../ui/Glass';
import { Filter } from 'lucide-react';

interface InventoryFiltersProps {
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  categories: string[];
}

export function InventoryFilters({ 
  statusFilter, 
  setStatusFilter, 
  categoryFilter, 
  setCategoryFilter,
  categories
}: InventoryFiltersProps) {
  
  const statuses = ['ALL', 'NORMAL', 'RESTOCK', 'OUT OF STOCK', 'MISPLACED'];

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
      <div className="seg glass" style={{ padding: '4px', display: 'flex', gap: '4px' }}>
        {statuses.map(s => (
          <button 
            key={s} 
            className={statusFilter === s ? 'selected' : ''} 
            onClick={() => setStatusFilter(s)}
            style={{ 
              padding: '6px 16px', 
              fontSize: '11px', 
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 600,
              color: statusFilter === s ? 'var(--text-primary)' : 'var(--text-tertiary)',
              background: statusFilter === s ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <Glass style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '4px' }}>
        <Filter size={14} className="text-tertiary" />
        <select 
          value={categoryFilter} 
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--text-secondary)',
            fontSize: '12px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="ALL">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Glass>
    </div>
  );
}
