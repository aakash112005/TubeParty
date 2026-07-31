import { LuSun, LuMoon } from 'react-icons/lu';
import { Modal } from '../ui/Modal';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from '../../context/ThemeContext';

export function SettingsModal({ isOpen, onClose }) {
  const { settings, updateSetting } = useSettings();
  const { isDark, toggleTheme } = useTheme();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Room settings" description="These preferences are saved on this device only.">
      <div className="space-y-1 divide-y divide-border">
        <div className="flex items-center justify-between py-2.5">
          <div>
            <p className="text-sm font-medium text-ink">Appearance</p>
            <p className="text-xs text-muted">Switch between dark and light mode</p>
          </div>
          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            {isDark ? <LuMoon className="h-3.5 w-3.5" /> : <LuSun className="h-3.5 w-3.5" />}
            {isDark ? 'Dark' : 'Light'}
          </Button>
        </div>

        <Switch
          label="Sound effects"
          description="Play a sound for key room events"
          checked={settings.soundEffects}
          onChange={(v) => updateSetting('soundEffects', v)}
        />
        <Switch
          label="Notifications"
          description="Toast notifications for joins, roles, and messages"
          checked={settings.notifications}
          onChange={(v) => updateSetting('notifications', v)}
        />
        <Switch
          label="Animations"
          description="Enable motion effects across the app"
          checked={settings.animations}
          onChange={(v) => updateSetting('animations', v)}
        />
        <Switch
          label="Compact mode"
          description="Tighter spacing for smaller screens"
          checked={settings.compactMode}
          onChange={(v) => updateSetting('compactMode', v)}
        />
      </div>
    </Modal>
  );
}
