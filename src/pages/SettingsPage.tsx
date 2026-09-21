import React from 'react';
import { Glass } from '../components/ui/Glass';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { Moon, Sun, Play, MonitorPlay, ShieldCheck, UserCircle2 } from 'lucide-react';

export function SettingsPage() {
  const { settings, updateSettings } = useAppSettings();

  return (
    <div className="page-grid" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Glass className="map-shell" style={{ height: 'auto', padding: '32px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div className="panel-head">
          <div>
            <span className="eyebrow">DASHBOARD CONFIGURATION</span>
            <h2>Settings</h2>
          </div>
        </div>

        <div className="settings-list" style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '24px' }}>
          
          <div className="setting-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '24px' }}>
            <div>
              <b style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <ShieldCheck size={16} className="text-cyan" />
                Active Role
              </b>
              <p style={{ margin: '4px 0 0 24px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Switch between Manager (full access) and Worker (read-only) prototype roles.
              </p>
            </div>
            <div className="seg" style={{ display: 'flex', background: 'var(--glass-surface-l2)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
              <button 
                className={settings.role === 'MANAGER' ? 'selected' : ''} 
                onClick={() => updateSettings({ role: 'MANAGER' })}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                MANAGER
              </button>
              <button 
                className={settings.role === 'WORKER' ? 'selected' : ''} 
                onClick={() => updateSettings({ role: 'WORKER' })}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                WORKER
              </button>
            </div>
          </div>

          <div className="setting-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '24px' }}>
            <div>
              <b style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                {settings.theme === 'dark' ? <Moon size={16} className="text-purple" /> : <Sun size={16} className="text-orange" />}
                Theme
              </b>
              <p style={{ margin: '4px 0 0 24px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Toggle the Liquid Glass aesthetic between light and dark modes.
              </p>
            </div>
            <div className="seg" style={{ display: 'flex', background: 'var(--glass-surface-l2)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
              <button 
                className={settings.theme === 'dark' ? 'selected' : ''} 
                onClick={() => updateSettings({ theme: 'dark' })}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                DARK
              </button>
              <button 
                className={settings.theme === 'light' ? 'selected' : ''} 
                onClick={() => updateSettings({ theme: 'light' })}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                LIGHT
              </button>
            </div>
          </div>

          <div className="setting-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '24px' }}>
            <div>
              <b style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <Play size={16} className="text-green" />
                Motion & Animation
              </b>
              <p style={{ margin: '4px 0 0 24px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Enable or reduce ambient motion and transitions.
              </p>
            </div>
            <div className="seg" style={{ display: 'flex', background: 'var(--glass-surface-l2)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
              <button 
                className={settings.motion === 'on' ? 'selected' : ''} 
                onClick={() => updateSettings({ motion: 'on' })}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                ON
              </button>
              <button 
                className={settings.motion === 'reduced' ? 'selected' : ''} 
                onClick={() => updateSettings({ motion: 'reduced' })}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                REDUCED
              </button>
            </div>
          </div>

          <div className="setting-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <b style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <MonitorPlay size={16} className="text-orange" />
                Edge Simulation
              </b>
              <p style={{ margin: '4px 0 0 24px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Simulate active YOLO11n + ByteTrack analysis on the Store Map.
              </p>
            </div>
            <div className="seg" style={{ display: 'flex', background: 'var(--glass-surface-l2)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
              <button 
                className={settings.simulation === 'on' ? 'selected' : ''} 
                onClick={() => updateSettings({ simulation: 'on' })}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                ON
              </button>
              <button 
                className={settings.simulation === 'off' ? 'selected' : ''} 
                onClick={() => updateSettings({ simulation: 'off' })}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                OFF
              </button>
            </div>
          </div>
          
        </div>
      </Glass>
    </div>
  );
}
