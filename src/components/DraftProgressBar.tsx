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

        const teamColor = team === 1 ? '#4488FF' : '#FF4444';
        let bg: string;
        if (isCurrent) bg = isBan ? '#FF6666' : teamColor;
        else if (isDone) bg = isBan ? '#FF666699' : teamColor + '99';
        else bg = isBan ? '#FF666618' : teamColor + '18';

        return (
          <div
            key={i}
            className={`rounded-sm transition-all flex items-center justify-center ${isCurrent ? 'progress-pulse' : ''}`}
            title={`Step ${i + 1}: Team ${team} ${isBan ? 'BAN' : 'PICK'}`}
            style={{
              width: isCurrent ? 24 : 16,
              height: isCurrent ? 18 : 14,
              background: bg,
              border: isCurrent ? '1.5px solid #FFD700' : `1px solid ${isDone ? teamColor + '44' : teamColor + '10'}`,
              boxShadow: isCurrent ? `0 0 8px rgba(255,215,0,0.4)` : 'none',
              fontSize: 8,
              color: isDone ? '#fff' : isCurrent ? '#fff' : '#555',
              fontWeight: isCurrent ? 'bold' : 'normal',
              opacity: isFuture ? 0.4 : 1,
            }}
          >
            {isDone ? '✓' : ''}
          </div>
        );
      })}
    </div>
  );
}

export default React.memo(DraftProgressBar);
