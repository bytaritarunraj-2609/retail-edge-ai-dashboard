import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useIntelligence } from '../hooks/useIntelligence';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { InventorySummary } from '../components/inventory/InventorySummary';
import { InventoryFilters } from '../components/inventory/InventoryFilters';
import { InventoryTable } from '../components/inventory/InventoryTable';
import { InventoryDetailDrawer } from '../components/inventory/InventoryDetailDrawer';
import { Glass } from '../components/ui/Glass';

export function Inventory() {
  const data = useIntelligence();
  const { searchQuery, selectedShelfId, setSelectedShelfId } = useAppSettings();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activeShelfId, setActiveShelfId] = useState<number | null>(selectedShelfId);

  // Sync global selectedShelfId into local drawer state, then clear global to avoid getting stuck open
  useEffect(() => {
    if (selectedShelfId !== null) {
      setActiveShelfId(selectedShelfId);
      setSelectedShelfId(null);
    }
  }, [selectedShelfId, setSelectedShelfId]);

  const shelves = data?.shelves || [];
  const cameras = data?.cameras || [];

  const categories = useMemo(() => {
    const cats = new Set(shelves.map(s => s.category));
    return Array.from(cats).sort();
  }, [shelves]);

  const filteredShelves = useMemo(() => {
    return shelves.filter(s => {
      // Status filter
      if (statusFilter !== 'ALL' && s.status.replace('_', ' ') !== statusFilter) return false;
      
      // Category filter
      if (categoryFilter !== 'ALL' && s.category !== categoryFilter) return false;

      // Search query filter (matches logic in Header, but scoped to table rows)
      if (searchQuery.length > 1) {
        const sq = searchQuery.toLowerCase();
        if (!(
          s.product.toLowerCase().includes(sq) ||
          s.zone.toLowerCase().includes(sq) ||
          s.status.toLowerCase().includes(sq) ||
          s.category.toLowerCase().includes(sq) ||
          `shelf ${String(s.id).padStart(2, '0')}`.includes(sq) ||
          `cam ${String(s.cameraId).padStart(2, '0')}`.includes(sq)
        )) {
          return false;
        }
      }
      return true;
    });
  }, [shelves, statusFilter, categoryFilter, searchQuery]);

  const activeShelf = shelves.find(s => s.id === activeShelfId) || null;
  const activeCamera = activeShelf ? cameras.find(c => c.id === activeShelf.cameraId) || null : null;

  if (!data) return <div style={{ padding: '24px' }}>Loading inventory intelligence...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.1, duration: 0.5, ease: [0.2, 0.9, 0.4, 1] }}
      style={{ padding: '24px 32px', height: '100%', overflowY: 'auto' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>REAL-TIME SHELF INTELLIGENCE</span>
          <h1 style={{ fontSize: '32px', margin: 0 }}>Inventory</h1>
        </div>
        <span className="live-pill" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '11px', letterSpacing: '0.05em' }}>
          <i className="pulse-dot" /> SIMULATED EDGE AI
        </span>
      </div>

      <InventorySummary shelves={shelves} />

      <Glass style={{ padding: '24px' }}>
        <InventoryFilters 
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          categories={categories}
        />

        <InventoryTable 
          shelves={filteredShelves} 
          onSelectShelf={setActiveShelfId} 
        />
      </Glass>

      <AnimatePresence>
        {activeShelf && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveShelfId(null)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
                zIndex: 90
              }}
            />
            <InventoryDetailDrawer 
              shelf={activeShelf} 
              camera={activeCamera}
              onClose={() => setActiveShelfId(null)} 
            />
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
