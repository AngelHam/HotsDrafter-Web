'use client';

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
  return name.replace(/'/g, '').replace(/ /g, '-');
}

interface HeroPortraitProps {
  hero: Hero;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  banned?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
}

const SIZE_MAP = { sm: 40, md: 56, lg: 80 };

export default function HeroPortrait({ hero, size = 'md', selected, banned, dimmed, onClick }: HeroPortraitProps) {
  const px = SIZE_MAP[size];
  const borderColor = selected ? '#FFD700' : banned ? '#FF6666' : ROLE_COLORS[hero.role] || '#666';

  return (
    <button
      onClick={onClick}
      className="relative flex-shrink-0 rounded transition-transform hover:scale-110 focus:outline-none"
      style={{
        width: px, height: px,
        border: `2px solid ${borderColor}`,
        opacity: dimmed ? 0.3 : 1,
        filter: banned ? 'grayscale(80%)' : undefined,
      }}
      title={hero.nicknames[0]}
    >
      <Image
        src={`/hero_portraits/${getPortraitFilename(hero)}.png`}
        alt={hero.nicknames[0]}
        width={px}
        height={px}
        className="rounded"
      />
      {banned && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-red text-2xl font-bold">✕</span>
        </div>
      )}
    </button>
  );
}
