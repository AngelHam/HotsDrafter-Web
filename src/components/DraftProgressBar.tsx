'use client';

import { DRAFT_IS_BAN, DRAFT_TEAM_ORDER } from '@/data/DraftingTool';

interface DraftProgressBarProps {
  currentStep: number;
}

export default function DraftProgressBar({ currentStep }: DraftProgressBarProps) {
  return (
    <div className="flex gap-0.5">
      {DRAFT_TEAM_ORDER.map((team, i) => {
        const isBan = DRAFT_IS_BAN[i];
        const isCurrent = i === currentStep;
        const isDone = i < currentStep;

        let bg: string;
        if (isCurrent) bg = '#FFFFFF';
        else if (isDone) bg = isBan ? '#FF666699' : (team === 1 ? '#4488FF99' : '#FF444499');
        else bg = isBan ? '#FF666633' : (team === 1 ? '#4488FF33' : '#FF444433');

        return (
          <div
            key={i}
            className="flex flex-col items-center"
            title={`Step ${i + 1}: Team ${team} ${isBan ? 'BAN' : 'PICK'}`}
          >
            <div
              className="rounded-sm transition-all"
              style={{
                width: isCurrent ? 24 : 16,
                height: 12,
                background: bg,
                border: isCurrent ? '2px solid #FFD700' : '1px solid transparent',
              }}
            />
            <span className="text-[8px] mt-0.5 opacity-50">
              {isBan ? 'B' : 'P'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
