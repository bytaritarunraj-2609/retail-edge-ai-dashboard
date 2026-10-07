import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useIntelligence } from '../hooks/useIntelligence';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { TeamSummary } from '../components/team/TeamSummary';
import { TeamMemberCard } from '../components/team/TeamMemberCard';
import { ZoneAssignments } from '../components/team/ZoneAssignments';
import { TeamTaskPanel } from '../components/team/TeamTaskPanel';
import { TeamMemberDrawer } from '../components/team/TeamMemberDrawer';

export function Team() {
  const data = useIntelligence();
  const { searchQuery } = useAppSettings();

  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);

  const team = data?.team || [];
  const actions = data?.actions || [];
  const shelves = data?.shelves || [];

  const filteredTeam = useMemo(() => {
    if (searchQuery.length < 2) return team;
    const sq = searchQuery.toLowerCase();
    return team.filter(m => 
      m.name.toLowerCase().includes(sq) || 
      m.role.toLowerCase().includes(sq) || 
      m.zone.toLowerCase().includes(sq) ||
      m.status.toLowerCase().includes(sq)
    );
  }, [team, searchQuery]);

  const activeMember = team.find(m => m.id === activeMemberId) || null;

  if (!data) return <div style={{ padding: '24px' }}>Loading workforce intelligence...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.1, duration: 0.5, ease: [0.2, 0.9, 0.4, 1] }}
      style={{ padding: '24px 32px', height: '100%', overflowY: 'auto' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>RETAIL WORKFORCE INTELLIGENCE</span>
          <h1 style={{ fontSize: '32px', margin: 0 }}>Team</h1>
        </div>
        <span className="live-pill" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '11px', letterSpacing: '0.05em' }}>
          <i className="pulse-dot" /> SIMULATED EDGE AI
        </span>
      </div>

      <TeamSummary team={team} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', minHeight: '500px' }}>
        
        {/* Main Team Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', alignContent: 'start' }}>
          {filteredTeam.length > 0 ? (
            filteredTeam.map(member => (
              <TeamMemberCard 
                key={member.id} 
                member={member} 
                onClick={() => setActiveMemberId(member.id)} 
              />
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              No team members match your search criteria.
            </div>
          )}
        </div>

        {/* Side Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ flex: '0 0 250px' }}>
            <ZoneAssignments team={team} shelves={shelves} />
          </div>
          <div style={{ flex: 1, minHeight: '300px' }}>
            <TeamTaskPanel actions={actions} team={team} shelves={shelves} />
          </div>
        </div>

      </div>

      <AnimatePresence>
        {activeMember && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveMemberId(null)}
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
            <TeamMemberDrawer 
              member={activeMember} 
              actions={actions}
              shelves={shelves}
              onClose={() => setActiveMemberId(null)} 
            />
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
