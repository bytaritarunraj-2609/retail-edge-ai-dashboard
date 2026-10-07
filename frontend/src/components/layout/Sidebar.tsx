import { LayoutDashboard, MapPinned, PackageCheck, Users, BarChart3, Activity, Sparkles, Settings2 } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  active: string;
  setActive: (x: string) => void;
}

export function Sidebar({ active, setActive }: SidebarProps) {
  const items = [
    ['Overview', LayoutDashboard],
    ['Store Map', MapPinned],
    ['Inventory', PackageCheck],
    ['Team', Users],
    ['Footfall', BarChart3],
    ['Heatmap', Activity]
  ] as const;

  return (
    <aside className="sidebar glass">
      <div className="brand">
        <div className="brandmark">
          <Sparkles size={16} />
        </div>
        <div>
          <b>RETAIL EDGE</b>
          <span>AI CONTROL CONSOLE</span>
        </div>
      </div>
      {items.map(([name, Icon]) => (
        <button
          key={name as string}
          onClick={() => setActive(name as string)}
          className={'nav ' + (active === name ? 'active' : '')}
        >
          <Icon size={17} />
          <span>{name as string}</span>
          {active === name && <motion.i layoutId="nav-pill" />}
        </button>
      ))}
      <div className="sidebar-bottom">
        <button 
          className={'nav ' + (active === 'Settings' ? 'active' : '')}
          onClick={() => setActive('Settings')}
        >
          <Settings2 size={17} />
          <span>Settings</span>
          {active === 'Settings' && <motion.i layoutId="nav-pill" />}
        </button>
        <div className="edge-status">
          <span className="status-dot" /> EDGE NODE ONLINE
        </div>
      </div>
    </aside>
  );
}
