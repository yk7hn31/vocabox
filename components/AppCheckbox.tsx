'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import { Check } from '@/components/AppIcons';

interface AppCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children' | 'type'> {
  description?: ReactNode;
  label: ReactNode;
}

export function AppCheckbox({ className, checked, description, label, disabled, ...props }: AppCheckboxProps) {
  return (
    <label
      className={`app-checkbox${className ? ` ${className}` : ''}`}
      data-disabled={disabled ? 'true' : undefined}
      data-state={checked ? 'checked' : 'unchecked'}
    >
      <input
        checked={checked}
        className="app-checkbox-input"
        disabled={disabled}
        type="checkbox"
        {...props}
      />
      <span className="app-checkbox-control" aria-hidden="true">
        <Check width={13} height={13} strokeWidth={3} />
      </span>
      <span className="app-checkbox-copy">
        <span className="app-checkbox-label">{label}</span>
        {description && <span className="app-checkbox-description">{description}</span>}
      </span>
    </label>
  );
}
