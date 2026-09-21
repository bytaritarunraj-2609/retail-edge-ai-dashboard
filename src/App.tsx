import React, { useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Overview } from './pages/Overview';
import { Footfall } from './pages/Footfall';
import { MapPage } from './pages/MapPage';
import { Inventory } from './pages/Inventory';
import { Team } from './pages/Team';
import { Heatmap } from './pages/Heatmap';
import { Placeholder } from './pages/Placeholder';
import { SettingsPage } from './pages/SettingsPage';
import { useAppSettings } from './contexts/AppSettingsContext';

export function App() {
  const { activePage, setActivePage, settings, updateSettings } = useAppSettings();
  const mv = useMotionValue(0);
  const my = useMotionValue(0);
  
  // Conditionally apply spring based on motion setting
  const stiffness = settings.motion === 'on' ? 120 : 1000;
  const damping = settings.motion === 'on' ? 24 : 100;
  
  const sx = useSpring(mv, { stiffness, damping });
  const sy = useSpring(my, { stiffness, damping });

  useEffect(() => {
    if (settings.motion === 'reduced') return;
    
    const f = (e: MouseEvent) => {
      mv.set((e.clientX / window.innerWidth - 0.5) * 12);
      my.set((e.clientY / window.innerHeight - 0.5) * 12);
    };
    window.addEventListener('mousemove', f);
    return () => window.removeEventListener('mousemove', f);
  }, [mv, my, settings.motion]);

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <main className={settings.theme === 'light' ? 'app light' : 'app'} data-motion={settings.motion}>
      <motion.div className="ambient" style={{ x: sx, y: sy }} />
      <Sidebar active={activePage} setActive={setActivePage} />
      <section className="main">
        <Header active={activePage} />
        {activePage === 'Overview' ? (
          <Overview />
        ) : activePage === 'Footfall' ? (
          <Footfall />
        ) : activePage === 'Store Map' ? (
          <MapPage />
        ) : activePage === 'Inventory' ? (
          <Inventory />
        ) : activePage === 'Team' ? (
          <Team />
        ) : activePage === 'Heatmap' ? (
          <Heatmap />
        ) : activePage === 'Settings' ? (
          <SettingsPage />
        ) : (
          <Placeholder name={activePage} />
        )}
      </section>
      <button className="theme-toggle glass" onClick={toggleTheme}>
        {settings.theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
      </button>
    </main>
  );
}
