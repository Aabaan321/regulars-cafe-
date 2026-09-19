import type { ReactNode } from 'react';
import { TierShell } from '@/components/layout/tier-shell';

/** Public chrome for the Immersive tier, AR. */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <TierShell tier="immersive" locale="ar">
      {children}
    </TierShell>
  );
}
