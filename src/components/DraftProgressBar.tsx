'use client';

import { DRAFT_IS_BAN, DRAFT_TEAM_ORDER } from '@/data/DraftingTool';

interface DraftProgressBarProps {
  currentStep: number;
}

export default function DraftProgressBar({ currentStep }: DraftProgressBarProps) {
  return (
    <div className="flex gap-0.5 items-end">
      {DRAFT_TEAM_ORDER.map((team, i) => {
        const isBan = DRAFT_IS_BAN[i];
        const isCurrent = i === currentStep;
        const isDone = i < currentStep;

        const teamColor = team === 1 ? '#4488FF' : '#FF4444';
        let bg: string;
        if (isCurrent) bg = '#FFFFFF';
        else if (isDone) bg = isBan ? '#FF666699' : teamColor + '99';
        else bg = isBan ? '#FF666633' : teamColor + '33';

        return (
          <div
            key={i}
            className="flex flex-col items-center"
            title={`Step ${i + 1}: Team ${team} ${isBan ? 'BAN' : 'PICK'}`}
          >
            <div
              className="rounded-sm transition-all flex items-center justify-center"
              style={{
                width: isCurrent ? 28 : 18,
                height: isCurrent ? 20 : 14,
                background: bg,
                border: isCurrent ? '2px solid #FFD700' : `1px solid ${isDone ? teamColor + '66' : 'transparent'}`,
                fontSize: 8,
                color: isDone || isCurrent ? '#fff' : '#666',
                fontWeight: isCurrent ? 'bold' : 'normal',
              }}
            >
              {isDone || isCurrent ? (i + 1) : ''}
            </div>
            <span className="text-[7px] mt-0.5" style={{ color: isBan ? '#FF6666' : teamColor, opacity: isDone ? 0.8 : 0.4 }}>
              {isBan ? 'B' : `T${team}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
