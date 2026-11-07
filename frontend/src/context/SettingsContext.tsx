import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface SettingsState {
  autoPlayAudio: boolean;
  selectedVoiceAccent: 'en-US' | 'en-GB' | 'en-IN' | 'en-AU';
  dailyReminderEnabled: boolean;
  reminderTime: string;
  themeMode: 'light' | 'dark';
}

const DEFAULT_SETTINGS: SettingsState = {
  autoPlayAudio: true,
  selectedVoiceAccent: 'en-US',
  dailyReminderEnabled: true,
  reminderTime: '08:00 AM',
  themeMode: 'light'
};

interface SettingsContextValue {
  settings: SettingsState;
  updateSettings: (newSettings: Partial<SettingsState>) => Promise<void>;
  playSound: (text: string) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSettings: async () => {},
  playSound: () => {}
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount & listen for storage events across tabs/windows
  useEffect(() => {
    const loadSavedSettings = () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('vocab_settings');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setSettings(prev => ({
              ...prev,
              ...parsed
            }));
          } catch (e) {}
        }
      }
    };

    loadSavedSettings();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vocab_settings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch (err) {}
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<SettingsState>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem('vocab_settings', JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
  }, []);

  const playSound = useCallback((text: string) => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = settings.selectedVoiceAccent || 'en-US';
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => v.lang.replace('_', '-').toLowerCase().includes(settings.selectedVoiceAccent.toLowerCase()));
      if (match) utterance.voice = match;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }, [settings.selectedVoiceAccent]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, playSound }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
