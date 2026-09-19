import type { ReactNode } from 'react';
import { TierShell } from '@/components/layout/tier-shell';

/** Public chrome for the Signature tier, AR. */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <TierShell tier="signature" locale="ar">
      {children}
    </TierShell>
  );
}
