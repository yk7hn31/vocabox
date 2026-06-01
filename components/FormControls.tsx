'use client';

import { forwardRef, type SelectHTMLAttributes, type InputHTMLAttributes } from 'react';

export const AppSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ children, ...props }, ref) => (
  <div className="app-select-wrap">
    <select ref={ref} className="app-select" {...props}>
      {children}
    </select>
    <svg className="app-select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </div>
));
AppSelect.displayName = 'AppSelect';

export const AppDateInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>
>((props, ref) => (
  <input ref={ref} type="date" className="app-date-input" {...props} />
));
AppDateInput.displayName = 'AppDateInput';
