'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Hero } from '@/data/Hero';

const ROLE_COLORS: Record<string, string> = {
  Tank: '#6495ED',
  Healer: '#90EE90',
  DPS: '#FF6347',
  Mage: '#BA55D3',
  Offlane: '#FFA500',
  Specialist: '#A9A9A9',
};

function getPortraitFilename(hero: Hero): string {
  const name = hero.nicknames[0];
  // Handle special cases: "Lt. Morales" → "Lt-Morales", "Sgt. Hammer" → "Sgt-Hammer"
  return name
    .replace(/'/g, '')
    .replace(/\. /g, '-')
    .replace(/ /g, '-');
}

interface HeroPortraitProps {
  hero: Hero;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  banned?: boolean;
  dimmed?: boolean;
  showName?: boolean;
  tierBadge?: string;
  onClick?: () => void;
}

const SIZE_MAP = { sm: 40, md: 56, lg: 80 };

const TIER_COLORS: Record<string, string> = {
  S: '#FFD700', A: '#90EE90', B: '#87CEEB', C: '#FFA500', D: '#FF6666',
};

export default function HeroPortrait({ hero, size = 'md', selected, banned, dimmed, showName, tierBadge, onClick }: HeroPortraitProps) {
  const px = SIZE_MAP[size];
  const borderColor = selected ? '#FFD700' : banned ? '#FF6666' : ROLE_COLORS[hero.role] || '#666';
  const [imgError, setImgError] = useState(false);

  const Tag = onClick ? 'button' : 'div';

  return (
    <div className="flex flex-col items-center" style={{ width: showName ? px + 8 : undefined }}>
      <Tag
        onClick={onClick}
        className="relative flex-shrink-0 rounded transition-all focus:outline-none cursor-pointer hover:scale-110 hover:z-10 hero-glow"
        style={{
          width: px, height: px,
          border: `2px solid ${borderColor}`,
          opacity: dimmed ? 0.3 : 1,
          filter: banned ? 'grayscale(80%)' : undefined,
          boxShadow: selected ? `0 0 8px ${borderColor}` : undefined,
          '--glow-color': borderColor + '88',
        } as React.CSSProperties}
        title={hero.nicknames[0]}
      >
      {imgError ? (
        <div className="w-full h-full rounded flex items-center justify-center" style={{ background: borderColor + '33' }}>
          <span className="font-bold" style={{ color: borderColor, fontSize: px * 0.35 }}>
            {hero.nicknames[0].substring(0, 2).toUpperCase()}
          </span>
        </div>
      ) : (
        <Image
          src={`/hero_portraits/${getPortraitFilename(hero)}.png`}
          alt={hero.nicknames[0]}
          width={px}
          height={px}
          className="rounded"
          onError={() => setImgError(true)}
        />
      )}
      {banned && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
          <span className="text-2xl font-bold" style={{ color: '#FF6666' }}>✕</span>
        </div>
      )}
      {tierBadge && !dimmed && (
        <div className="absolute -top-1 -right-1 text-[8px] font-bold px-1 rounded" style={{
          background: TIER_COLORS[tierBadge] + '33',
          color: TIER_COLORS[tierBadge] || '#888',
          border: `1px solid ${TIER_COLORS[tierBadge] || '#888'}66`,
          lineHeight: '14px',
        }}>
          {tierBadge}
        </div>
      )}
      </Tag>
      {showName && (
        <span className="text-[9px] mt-0.5 text-center w-full leading-tight" style={{ opacity: dimmed ? 0.3 : 0.7, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {hero.nicknames[0]}
        </span>
      )}
    </div>
  );
}
