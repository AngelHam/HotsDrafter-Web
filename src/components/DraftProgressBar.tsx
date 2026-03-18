'use client';

import { DRAFT_IS_BAN, DRAFT_TEAM_ORDER } from '@/data/DraftingTool';

interface DraftProgressBarProps {
  currentStep: number;
}

export default function DraftProgressBar({ currentStep }: DraftProgressBarProps) {
  const currentTeam = currentStep < DRAFT_TEAM_ORDER.length ? DRAFT_TEAM_ORDER[currentStep] : 0;
  const currentIsBan = currentStep < DRAFT_IS_BAN.length ? DRAFT_IS_BAN[currentStep] : false;

  return (
    <div className="flex flex-col items-center gap-1.5" role="progressbar" aria-label="Draft progress" aria-valuenow={currentStep} aria-valuemin={0} aria-valuemax={16}>
      <div className="flex items-center gap-4 text-xs" style={{ opacity: 0.9 }}>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#4488FF' }} /> Team 1</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#FF4444' }} /> Team 2</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#FF666666' }} /> Ban</span>
      </div>

      <div className="flex gap-1 items-end">
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
                className={`rounded transition-all flex items-center justify-center ${isCurrent ? 'progress-pulse' : ''}`}
                style={{
                  width: isCurrent ? 34 : 24,
                  height: isCurrent ? 26 : 20,
                  background: bg,
                  border: isCurrent ? '2px solid #FFD700' : `1px solid ${isDone ? teamColor + '66' : teamColor + '22'}`,
                  boxShadow: isCurrent ? '0 0 12px rgba(255,215,0,0.5)' : 'none',
                  fontSize: isCurrent ? 11 : 10,
                  color: isDone || isCurrent ? '#fff' : '#888',
                  fontWeight: isCurrent ? 'bold' : 'normal',
                  letterSpacing: '-0.5px',
                }}
              >
                {i + 1}
              </div>
              <span className="text-[9px] mt-0.5 font-semibold" style={{ color: isBan ? '#FF6666' : teamColor, opacity: isCurrent ? 1 : isDone ? 0.8 : 0.4 }}>
                {isBan ? 'BAN' : `T${team}`}
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-xs font-semibold" style={{ color: currentIsBan ? '#FF6666' : (currentTeam === 1 ? '#4488FF' : '#FF6666') }}>
        {currentStep >= DRAFT_TEAM_ORDER.length
          ? '✅ Draft Complete'
          : `Now: Team ${currentTeam} ${currentIsBan ? 'BAN' : 'PICK'} (${currentStep + 1}/16)`}
      </div>
    </div>
  );
}
