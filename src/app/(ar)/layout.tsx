import type { ReactNode } from 'react';
import { RootShell, rootMetadata, rootViewport } from '@/lib/config/root-layout';
import { arabicFontVariables } from '@/lib/config/fonts-arabic';

export const metadata = rootMetadata;
export const viewport = rootViewport;

/** Root layout for the Arabic routes — <html lang="ar" dir="rtl">. */
export default function ArabicRootLayout({ children }: { children: ReactNode }) {
  return (
    <RootShell locale="ar" fontClassName={arabicFontVariables}>
      {children}
    </RootShell>
  );
}
