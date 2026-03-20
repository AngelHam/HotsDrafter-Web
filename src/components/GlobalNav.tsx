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
    <nav style={{
      position: 'fixed',
      bottom: 12,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 2,
      padding: '4px 12px',
      background: 'rgba(15, 20, 40, 0.95)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: '12px',
      border: '1px solid rgba(68, 102, 136, 0.6)',
      zIndex: 9999,
      height: 44,
      alignItems: 'center',
    }}>
      {NAV_ITEMS.map(({ href, label, emoji }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 8px',
              textDecoration: 'none',
              color: active ? '#00FFFF' : '#8899aa',
              fontSize: 11,
              lineHeight: 1.1,
              borderBottom: active ? '2px solid #00FFFF' : '2px solid transparent',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              if (!active) (e.currentTarget as HTMLElement).style.color = '#ffffff';
            }}
            onMouseLeave={e => {
              if (!active) (e.currentTarget as HTMLElement).style.color = '#8899aa';
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>{emoji}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
