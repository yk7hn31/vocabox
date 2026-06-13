'use client';

import { LazyMotion } from 'framer-motion';
import type { ReactNode } from 'react';

const loadFeatures = () => import('framer-motion').then(m => m.domMax);

// Loads framer's feature bundle once and lazily; components use the lightweight
// `m` component instead of `motion`. `strict` makes any stray `motion.*` throw.
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
