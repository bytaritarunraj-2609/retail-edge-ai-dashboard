import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronRight, X, PackageSearch, PackageX, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { useIntelligence } from '../../hooks/useIntelligence';
import { mockAdapterInstance } from '../../adapters/MockIntelligenceAdapter';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  active: string;
}

export function Header({ active }: HeaderProps) {
  const { settings, updateSettings, setActivePage, setSelectedShelfId, searchQuery, setSearchQuery } = useAppSettings();
  const data = useIntelligence();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleRole = () => {
    updateSettings({ role: settings.role === 'MANAGER' ? 'WORKER' : 'MANAGER' });
  };

  const pendingActions = data?.actions.filter(a => a.status !== 'COMPLETED') || [];
  const unreadCount = pendingActions.length;

  const getActionIcon = (title: string) => {
    if (title.includes('OUT OF STOCK')) return <PackageX size={14} className="text-red" />;
    if (title.includes('RESTOCK')) return <AlertTriangle size={14} className="text-orange" />;
    if (title.includes('MISPLACED')) return <PackageSearch size={14} className="text-purple" />;
    return <AlertTriangle size={14} className="text-orange" />;
  };

  // Basic search filtering over shelves and actions
  const searchResults = (data?.shelves || []).filter(s => 
    searchQuery.length > 1 && 
    (s.product.toLowerCase().includes(searchQuery.toLowerCase()) || 
     s.zone.toLowerCase().includes(searchQuery.toLowerCase()) || 
     s.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
     `shelf ${String(s.id).padStart(2, '0')}`.includes(searchQuery.toLowerCase()) ||
     `cam ${String(s.cameraId).padStart(2, '0')}`.includes(searchQuery.toLowerCase()))
  );

  return (
    <header className="topbar">
      <div>
        <span className="eyebrow">STORE 01 · CHENNAI</span>
        <h1>{active}</h1>
      </div>
      <div className="top-actions">
        
        <div className="search-container" style={{ position: 'relative' }}>
          <div className="search glass">
            <Search size={16} />
            <input 
              placeholder="Search store intelligence…" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="clear-btn"><X size={14} /></button>}
          </div>
          
          <AnimatePresence>
            {searchQuery.length > 1 && active !== 'Inventory' && (
              <motion.div 
                className="search-dropdown glass"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {searchResults.length > 0 ? (
                  searchResults.map(shelf => (
                    <button 
                      key={shelf.id} 
                      className="search-result"
                      onClick={() => {
                        setSelectedShelfId(shelf.id);
                        if (active !== 'Inventory') {
                          setActivePage('Store Map');
                        }
                        setSearchQuery('');
                      }}
                    >
                      <span className="result-title">Shelf {String(shelf.id).padStart(2, '0')} - {shelf.product}</span>
                      <span className="result-meta">{shelf.zone} · {shelf.status.replace('_', ' ')}</span>
                    </button>
                  ))
                ) : (
                  <div className="search-empty">No results found</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="notification-container" ref={notifRef} style={{ position: 'relative' }}>
          <button className="icon glass" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={17} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                className="notification-popover glass"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
              >
                <div className="notif-header">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && <span>{unreadCount} pending</span>}
                </div>
                <div className="notif-body">
                  {pendingActions.length > 0 ? (
                    pendingActions.map(action => (
                      <div key={action.id} className={`notif-item ${action.status === 'COMPLETING' ? 'completing' : ''}`}>
                        <div className="notif-icon">{getActionIcon(action.title)}</div>
                        <div className="notif-content">
                          <b>{action.title}</b>
                          <p>{action.product} · {action.camera}</p>
                          <small>{action.time}</small>
                        </div>
                        {action.status === 'ACTIVE' && (
                          <button 
                            className="mark-read-btn" 
                            title="Mark as read"
                            onClick={() => mockAdapterInstance.markNotificationRead(action.id)}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="notif-empty">No new notifications</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className="profile glass" onClick={toggleRole}>
          <div className="avatar">{settings.role === 'MANAGER' ? 'MG' : 'WK'}</div>
          <div>
            <b>{settings.role === 'MANAGER' ? 'Manager' : 'Worker'}</b>
            <span>Online</span>
          </div>
          <ChevronRight size={15} />
        </button>
      </div>
    </header>
  );
}
