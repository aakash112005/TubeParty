import { Switch as HeadlessSwitch } from '@headlessui/react';
import { cn } from '../../utils/cn';

export function Switch({ checked, onChange, label, description }) {
  return (
    <HeadlessSwitch.Group as="div" className="flex items-center justify-between gap-4 py-2.5">
      <span className="flex-1">
        <HeadlessSwitch.Label as="p" className="text-sm font-medium text-ink" passive>
          {label}
        </HeadlessSwitch.Label>
        {description ? <p className="text-xs text-muted">{description}</p> : null}
      </span>
      <HeadlessSwitch
        checked={checked}
        onChange={onChange}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-surface-hover'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </HeadlessSwitch>
    </HeadlessSwitch.Group>
  );
}
