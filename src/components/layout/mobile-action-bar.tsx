'use client';

import { useEffect, useState } from 'react';
import { brand, directionsHref, telHref, whatsappHref } from '@/lib/config/brand';
import type { Dictionary } from '@/lib/i18n/dictionaries';

/**
 * The sticky mobile action bar: call, directions, WhatsApp.
 *
 * Phone-only, and it stays out of the way until the visitor has actually
 * started reading — appearing at load would cover the hero, which is the one
 * thing the page is for. It also hides while the on-screen keyboard is up, so
 * it never sits on top of a form field someone is typing into.
 */
export function MobileActionBar({ dict }: { dict: Dictionary }) {
  const [visible, setVisible] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setKeyboardOpen(vv.height < window.innerHeight * 0.75);
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  const actions = [
    { href: telHref, label: dict.common.call, icon: '☎', external: false },
    { href: directionsHref, label: dict.common.directions, icon: '➤', external: true },
    { href: whatsappHref(`Hi ${brand.name} —`), label: dict.common.whatsapp, icon: '✆', external: true },
  ];

  return (
    <div
      data-print="hide"
      className={[
        'fixed inset-x-0 bottom-0 z-40 sm:hidden',
        'border-line bg-bg/95 border-t backdrop-blur-md',
        'pb-[env(safe-area-inset-bottom)]',
        'transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)]',
        visible && !keyboardOpen ? 'translate-y-0' : 'translate-y-full',
      ].join(' ')}
      aria-hidden={!visible || keyboardOpen}
    >
      <ul className="grid grid-cols-3">
        {actions.map((action) => (
          <li key={action.label} className="border-line/60 border-e last:border-e-0">
            <a
              href={action.href}
              {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              tabIndex={visible && !keyboardOpen ? undefined : -1}
              className="hover:bg-bg-subtle active:bg-bg-subtle flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 py-2 no-underline"
            >
              <span aria-hidden="true" className="text-accent text-[15px] leading-none">
                {action.icon}
              </span>
              <span className="text-2xs font-bold">{action.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
