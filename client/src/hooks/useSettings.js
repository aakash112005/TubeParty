import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { LOCAL_STORAGE_KEYS } from '../constants/app';

const DEFAULT_SETTINGS = {
  soundEffects: true,
  notifications: true,
  animations: true,
  compactMode: false,
};

export function useSettings() {
  const [settings, setSettings] = useLocalStorage(LOCAL_STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

  const updateSetting = useCallback(
    (key, value) => setSettings((prev) => ({ ...prev, [key]: value })),
    [setSettings]
  );

  return { settings, updateSetting };
}
