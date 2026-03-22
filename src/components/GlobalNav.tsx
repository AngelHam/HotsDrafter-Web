'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

const NAV_ITEMS = [
  { href: '/', label: 'Home', emoji: '🏠' },
  { href: '/draft', label: 'Draft', emoji: '⚔️' },
  { href: '/draft/companion', label: 'Live', emoji: '⚡' },
  { href: '/sample', label: 'Sample', emoji: '🎲' },
  { href: '/team-builder', label: 'Build', emoji: '🏗️' },
  { href: '/compare', label: 'Comp', emoji: '⚖️' },
  { href: '/tier-list', label: 'Tier', emoji: '🏆' },
  { href: '/history', label: 'Hist', emoji: '📜' },
  { href: '/settings', label: 'Settings', emoji: '⚙️' },
];

function GlobalNav() {
  const pathname = usePathname();
  const { theme } = useTheme();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const accent = theme === 'light' ? '#0088aa' : '#00FFFF';
  const muted = theme === 'light' ? '#5a6a7a' : '#8899aa';
  const hoverColor = theme === 'light' ? '#1a1a2e' : '#ffffff';

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 sm:bottom-3 left-0 sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-auto flex justify-center sm:justify-start gap-0 sm:gap-0.5 px-1 sm:px-3 py-1 sm:py-1 z-[9999]" style={{
      background: 'var(--theme-nav-bg)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: typeof window !== 'undefined' && window.innerWidth < 640 ? '0' : '12px',
      border: `1px solid var(--theme-nav-border)`,
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
              color: active ? accent : muted,
              fontSize: 10,
              lineHeight: 1.1,
              borderBottom: active ? `2px solid ${accent}` : '2px solid transparent',
              flex: '1 1 0',
              maxWidth: 64,
            }}
            aria-label={`Navigate to ${label} page`}
            aria-current={active ? 'page' : undefined}
            onMouseEnter={e => {
              if (!active) (e.currentTarget as HTMLElement).style.color = hoverColor;
            }}
            onMouseLeave={e => {
              if (!active) (e.currentTarget as HTMLElement).style.color = muted;
            }}
          >
            <span className="text-sm sm:text-base leading-none" aria-hidden="true">{emoji}</span>
            <span className="hidden min-[360px]:inline text-[9px] sm:text-[11px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default React.memo(GlobalNav);
