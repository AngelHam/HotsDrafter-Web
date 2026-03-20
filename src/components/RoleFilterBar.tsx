'use client';

const ROLES = [
  { key: 'All', label: 'All', icon: '🌐', color: '#00FF00' },
  { key: 'Tank', label: 'Tank', icon: '🛡️', color: '#6495ED' },
  { key: 'Healer', label: 'Healer', icon: '✚', color: '#90EE90' },
  { key: 'DPS', label: 'DPS', icon: '⚔️', color: '#FF6347' },
  { key: 'Mage', label: 'Mage', icon: '✨', color: '#BA55D3' },
  { key: 'Offlane', label: 'Offlane', icon: '⚙️', color: '#FFA500' },
  { key: 'Specialist', label: 'Spec', icon: '🔧', color: '#A9A9A9' },
];

export const ROLE_COLORS: Record<string, string> = {
  Tank: '#6495ED',
  Healer: '#90EE90',
  DPS: '#FF6347',
  Mage: '#BA55D3',
  Offlane: '#FFA500',
  Specialist: '#A9A9A9',
};

interface RoleFilterBarProps {
  activeFilter: string;
  onFilterChange: (role: string) => void;
}

export default function RoleFilterBar({ activeFilter, onFilterChange }: RoleFilterBarProps) {
  return (
    <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Filter heroes by role">
      {ROLES.map(({ key, label, icon, color }) => (
        <button
          key={key}
          onClick={() => onFilterChange(key)}
          className="px-3 py-1.5 rounded text-sm font-semibold transition-all hover:brightness-110"
          style={{
            background: activeFilter === key ? color : 'rgba(30, 40, 70, 0.7)',
            color: activeFilter === key ? '#000' : color,
            border: `1px solid ${activeFilter === key ? color : 'rgba(68, 102, 136, 0.5)'}`,
          }}
          aria-label={`Filter by ${label} role`}
          aria-pressed={activeFilter === key}
          title={`Filter heroes by ${label}`}
        >
          <span aria-hidden="true">{icon}</span> {label}
        </button>
      ))}
    </div>
  );
}
