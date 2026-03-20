'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Home', emoji: '🏠' },
  { href: '/draft', label: 'Draft', emoji: '⚔️' },
  { href: '/sample', label: 'Sample', emoji: '🎲' },
  { href: '/team-builder', label: 'Build', emoji: '🏗️' },
  { href: '/compare', label: 'Comp', emoji: '⚖️' },
  { href: '/tier-list', label: 'Tier', emoji: '🏆' },
  { href: '/history', label: 'Hist', emoji: '📜' },
  { href: '/settings', label: 'Settings', emoji: '⚙️' },
];

export default function GlobalNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 sm:bottom-3 left-0 sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-auto flex justify-center sm:justify-start gap-0 sm:gap-0.5 px-1 sm:px-3 py-1 sm:py-1 z-[9999]" style={{
      background: 'rgba(15, 20, 40, 0.97)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: typeof window !== 'undefined' && window.innerWidth < 640 ? '0' : '12px',
      border: '1px solid rgba(68, 102, 136, 0.6)',
      borderBottom: 'none',
      height: 'auto',
      minHeight: 44,
      alignItems: 'center',
    }}>
      {NAV_ITEMS.map(({ href, label, emoji }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center px-1.5 sm:px-2 py-1 no-underline transition-colors"
            style={{
              color: active ? '#00FFFF' : '#8899aa',
              fontSize: 10,
              lineHeight: 1.1,
              borderBottom: active ? '2px solid #00FFFF' : '2px solid transparent',
              flex: '1 1 0',
              maxWidth: 64,
            }}
            onMouseEnter={e => {
              if (!active) (e.currentTarget as HTMLElement).style.color = '#ffffff';
            }}
            onMouseLeave={e => {
              if (!active) (e.currentTarget as HTMLElement).style.color = '#8899aa';
            }}
          >
            <span className="text-sm sm:text-base leading-none">{emoji}</span>
            <span className="hidden min-[360px]:inline text-[9px] sm:text-[11px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
