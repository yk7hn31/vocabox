'use client';

import { FeatherIcon, type FeatherIconName } from '@/components/FeatherIcon';

export type IconName =
  | 'x' | 'check' | 'heart' | 'cup' | 'cr' | 'ccw'
  | 'award' | 'pen' | 'list' | 'file' | 'info' | 'zap';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  sw?: number;
}

const iconNames = {
  x: 'x',
  check: 'check-circle',
  heart: 'heart',
  cup: 'upload',
  cr: 'chevron-right',
  ccw: 'rotate-ccw',
  award: 'award',
  pen: 'edit-2',
  list: 'list',
  file: 'file-text',
  info: 'info',
  zap: 'zap',
} satisfies Record<IconName, FeatherIconName>;

export function Icon({ name, size = 16, color = 'currentColor', sw = 2 }: IconProps) {
  return (
    <FeatherIcon
      fill={name === 'zap' ? color : undefined}
      fillOpacity={name === 'zap' ? .15 : undefined}
      height={size}
      name={iconNames[name]}
      stroke={color}
      strokeWidth={sw}
      style={{ flexShrink: 0 }}
      width={size}
    />
  );
}
