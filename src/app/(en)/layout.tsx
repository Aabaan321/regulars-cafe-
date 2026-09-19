import type { ReactNode } from 'react';
import { RootShell, rootMetadata, rootViewport } from '@/lib/config/root-layout';
import { latinFontVariables } from '@/lib/config/fonts';

export const metadata = rootMetadata;
export const viewport = rootViewport;

/** Root layout for every left-to-right route. */
export default function EnglishRootLayout({ children }: { children: ReactNode }) {
  return (
    <RootShell locale="en" fontClassName={latinFontVariables}>
      {children}
    </RootShell>
  );
}
