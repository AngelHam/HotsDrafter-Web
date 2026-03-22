'use client';

import React from 'react';
import { DRAFT_IS_BAN, DRAFT_TEAM_ORDER } from '@/data/DraftingTool';

interface DraftProgressBarProps {
  currentStep: number;
  teamOrder?: number[];
}

function DraftProgressBar({ currentStep, teamOrder }: DraftProgressBarProps) {
  const order = teamOrder || DRAFT_TEAM_ORDER;

  return (
    <div className="flex items-center gap-0.5" role="progressbar" aria-label="Draft progress" aria-valuenow={currentStep} aria-valuemin={0} aria-valuemax={16}>
      {order.map((team, i) => {
        const isBan = DRAFT_IS_BAN[i];
        const isCurrent = i === currentStep;
        const isDone = i < currentStep;
        const isFuture = i > currentStep;

        // Color logic: purple for bans, blue for T1 picks, red for T2 picks
        const banColor = '#9966CC';
        const t1Color = '#4488FF';
        const t2Color = '#FF4444';
        const stepColor = isBan ? banColor : (team === 1 ? t1Color : t2Color);

        let bg: string;
        if (isCurrent) bg = stepColor;
        else if (isDone) bg = stepColor + '99';
        else bg = stepColor + '18';

        // Label: current shows "B"/"1"/"2", past shows ✓, future shows nothing
        let label = '';
        if (isDone) label = '✓';
        else if (isCurrent || !isFuture) {
          if (isBan) label = 'B';
          else label = team === 1 ? '1' : '2';
        }

        return (
          <div
            key={i}
            className={`rounded-sm transition-all flex items-center justify-center ${isCurrent ? 'progress-pulse' : ''}`}
            title={`Step ${i + 1}: Team ${team} ${isBan ? 'BAN' : 'PICK'}`}
            style={{
              width: isCurrent ? 24 : 16,
              height: isCurrent ? 18 : 14,
              background: bg,
              border: isCurrent ? '1.5px solid #FFD700' : `1px solid ${isDone ? stepColor + '44' : stepColor + '10'}`,
              boxShadow: isCurrent ? `0 0 8px rgba(255,215,0,0.4)` : 'none',
              fontSize: isCurrent ? 9 : 7,
              color: isDone ? '#fff' : isCurrent ? '#fff' : stepColor,
              fontWeight: isCurrent ? 'bold' : 'normal',
              opacity: isFuture ? 0.4 : 1,
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}

export default React.memo(DraftProgressBar);
