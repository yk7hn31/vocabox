'use client';

import { domMax, LazyMotion } from 'framer-motion';
import type { ReactNode } from 'react';

// Loads framer's feature bundle once and lazily; components use the lightweight
// `m` component instead of `motion`. `strict` makes any stray `motion.*` throw.
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      {children}
    </LazyMotion>
  );
}
