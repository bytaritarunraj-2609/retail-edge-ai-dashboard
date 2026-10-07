import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppSettings, Role } from '../types';

interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  activePage: string;
  setActivePage: (page: string) => void;
  selectedShelfId: number | null;
  setSelectedShelfId: (id: number | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const defaultSettings: AppSettings = {
  role: 'MANAGER',
  theme: 'dark',
  motion: 'on',
  simulation: 'on'
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [activePage, setActivePage] = useState('Overview');
  const [selectedShelfId, setSelectedShelfId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <AppSettingsContext.Provider value={{
      settings,
      updateSettings,
      activePage,
      setActivePage,
      selectedShelfId,
      setSelectedShelfId,
      searchQuery,
      setSearchQuery
    }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}
