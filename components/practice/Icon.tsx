'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Award,
  ChevronRight,
  CircleCheck,
  FileText,
  Heart,
  Info,
  List,
  Pencil,
  RotateCcw,
  Upload,
  X,
  Zap,
} from 'lucide-react';

export type IconName =
  | 'x' | 'check' | 'heart' | 'cup' | 'cr' | 'ccw'
  | 'award' | 'pen' | 'list' | 'file' | 'info' | 'zap';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  sw?: number;
}

const icons = {
  x: X,
  check: CircleCheck,
  heart: Heart,
  cup: Upload,
  cr: ChevronRight,
  ccw: RotateCcw,
  award: Award,
  pen: Pencil,
  list: List,
  file: FileText,
  info: Info,
  zap: Zap,
} satisfies Record<IconName, LucideIcon>;

export function Icon({ name, size = 16, color = 'currentColor', sw = 2 }: IconProps) {
  const Glyph = icons[name];
  return (
    <Glyph
      fill={name === 'zap' ? color : undefined}
      fillOpacity={name === 'zap' ? .15 : undefined}
      height={size}
      stroke={color}
      strokeWidth={sw}
      style={{ flexShrink: 0 }}
      width={size}
    />
  );
}
