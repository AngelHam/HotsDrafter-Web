'use client';

const ROLES = [
  { key: 'All', label: 'All', icon: '🌐', color: '#00FF00' },
  { key: 'Tank', label: 'Tank', icon: '🛡️', color: '#6495ED' },
  { key: 'Healer', label: 'Healer', icon: '✚', color: '#90EE90' },
  { key: 'DPS', label: 'DPS', icon: '⚔️', color: '#FF6347' },
  { key: 'Mage', label: 'Mage', icon: '✨', color: '#BA55D3' },
  { key: 'Offlane', label: 'Offlane', icon: '⚙️', color: '#FFA500' },
];

interface RoleFilterBarProps {
  activeFilter: string;
  onFilterChange: (role: string) => void;
}

export default function RoleFilterBar({ activeFilter, onFilterChange }: RoleFilterBarProps) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {ROLES.map(({ key, label, icon, color }) => (
        <button
          key={key}
          onClick={() => onFilterChange(key)}
          className="px-3 py-1.5 rounded text-sm font-semibold transition-all"
          style={{
            background: activeFilter === key ? color : 'rgba(30, 40, 70, 0.7)',
            color: activeFilter === key ? '#000' : color,
            border: `1px solid ${activeFilter === key ? color : 'rgba(68, 102, 136, 0.5)'}`,
          }}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}
