'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface TutorialStep {
  title: string;
  content: string;
  icon: string;
  /** CSS selector for the element to spotlight; omit for a centered modal */
  target?: string;
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  storageKey: string;
  onClose: () => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 12;

function getSpotlightRect(selector: string): SpotlightRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PADDING,
    left: r.left - PADDING,
    width: r.width + PADDING * 2,
    height: r.height + PADDING * 2,
  };
}

export default function TutorialOverlay({ steps, storageKey, onClose }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  const updateSpotlight = useCallback(() => {
    if (step.target) {
      setSpotlight(getSpotlightRect(step.target));
    } else {
      setSpotlight(null);
    }
  }, [step]);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    updateSpotlight();
    const onResize = () => updateSpotlight();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [updateSpotlight]);

  const finish = useCallback(() => {
    localStorage.setItem(storageKey, 'true');
    setVisible(false);
    setTimeout(onClose, 200);
  }, [storageKey, onClose]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      finish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  // Focus trap for modal
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const focusable = card.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const trapHandler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', trapHandler);
    return () => window.removeEventListener('keydown', trapHandler);
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, finish]);

  // Card positioning: below or above spotlight, or centered
  const getCardStyle = (): React.CSSProperties => {
    if (!spotlight) {
      return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const viewH = window.innerHeight;
    const spaceBelow = viewH - (spotlight.top + spotlight.height);
    const spaceAbove = spotlight.top;
    const cardHeight = 220;

    if (spaceBelow > cardHeight + 20) {
      return {
        position: 'fixed',
        top: spotlight.top + spotlight.height + 16,
        left: Math.max(16, Math.min(spotlight.left, window.innerWidth - 440)),
      };
    }
    if (spaceAbove > cardHeight + 20) {
      return {
        position: 'fixed',
        top: spotlight.top - cardHeight - 16,
        left: Math.max(16, Math.min(spotlight.left, window.innerWidth - 440)),
      };
    }
    return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  };

  return (
    <div
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-label={`Tutorial: ${step.title}`}
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.2s ease' }}
    >
      {/* Overlay with spotlight cutout */}
      <svg className="fixed inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx="8"
                fill="black"
                style={{ transition: 'all 0.35s ease' }}
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#tutorial-spotlight-mask)"
        />
      </svg>

      {/* Spotlight border ring */}
      {spotlight && (
        <div
          className="fixed rounded-lg pointer-events-none"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            border: '2px solid rgba(0, 255, 255, 0.6)',
            boxShadow: '0 0 20px 4px rgba(0, 255, 255, 0.15)',
            transition: 'all 0.35s ease',
          }}
        />
      )}

      {/* Click-blocker (lets clicks through to the spotlight area) */}
      <div
        className="fixed inset-0"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => {
          // Don't block clicks on the card itself
          if (cardRef.current?.contains(e.target as Node)) return;
          e.preventDefault();
          e.stopPropagation();
        }}
      />

      {/* Tutorial card */}
      <div
        ref={cardRef}
        className="max-w-[420px] w-[calc(100%-32px)] rounded-xl p-5 shadow-2xl"
        style={{
          ...getCardStyle(),
          background: 'rgba(15, 20, 40, 0.98)',
          border: '1.5px solid rgba(0, 255, 255, 0.5)',
          backdropFilter: 'blur(12px)',
          zIndex: 10000,
          pointerEvents: 'auto',
          transition: 'top 0.35s ease, left 0.35s ease',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{step.icon}</span>
          <h2 className="text-base font-bold" style={{ color: '#00FFFF' }}>{step.title}</h2>
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {step.content}
        </p>

        {/* Step indicator dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === currentStep ? 10 : 7,
                height: i === currentStep ? 10 : 7,
                background: i === currentStep ? '#00FFFF' : i < currentStep ? '#00FFFF66' : 'rgba(255,255,255,0.2)',
                boxShadow: i === currentStep ? '0 0 6px #00FFFF' : 'none',
              }}
            />
          ))}
        </div>

        {/* Step counter + buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] opacity-40">
              Step {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={finish}
              className="text-[11px] px-2 py-1 rounded hover:opacity-100 transition-opacity"
              style={{ color: '#888', opacity: 0.6 }}
              title="Skip the tutorial"
            >
              Skip Tutorial
            </button>
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="text-xs px-3 py-1.5 rounded transition-all hover:bg-white/5"
                style={{ color: '#00FFFF', border: '1px solid rgba(0,255,255,0.3)' }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="text-xs px-4 py-1.5 rounded font-semibold transition-all hover:scale-105"
              style={{
                background: 'rgba(0, 255, 255, 0.15)',
                border: '1.5px solid #00FFFF',
                color: '#00FFFF',
              }}
            >
              {currentStep < steps.length - 1 ? 'Next →' : 'Got it! ✨'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Tutorial step definitions ── */

export const HOME_TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to HotsDrafter!',
    icon: '⚔️',
    content: 'This tool helps you draft better in Heroes of the Storm. We\'ll walk you through the key features to get started.',
  },
  {
    title: 'Select a Map',
    icon: '🗺️',
    content: 'Select a map to get started. Different maps favor different hero compositions. Pick one or use "Random" to let the tool choose.',
    target: '[data-tutorial-target="mapGrid"]',
  },
  {
    title: 'Choose a Mode',
    icon: '🎮',
    content: 'Choose a draft mode to begin your draft experience. Interactive Draft is the main feature — try it first!',
    target: '[data-tutorial-target="actionButtons"]',
  },
];

export const DRAFT_TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Draft Flow',
    icon: '📍',
    content: 'The draft has 16 steps: 6 bans and 10 picks, alternating between teams. Follow the progress bar to see where you are.',
    target: '[data-tutorial-target="progressBar"]',
  },
  {
    title: 'AI Suggestions',
    icon: '🤖',
    content: 'AI suggestions appear here based on synergies, counters, and map fitness. Each hero gets a composite score — higher is better.',
    target: '[data-tutorial-target="suggestions"]',
  },
  {
    title: 'Hero Grid',
    icon: '🦸',
    content: 'Click a hero from the grid to ban or pick them. Heroes are color-coded by role. Right-click for detailed info.',
    target: '[data-tutorial-target="heroGrid"]',
  },
  {
    title: 'Keyboard Shortcuts',
    icon: '⌨️',
    content: 'Use keyboard shortcuts: 1–7 to quick-pick suggestions, / to search, Ctrl+Z to undo, Escape to reset. Press ? for the full list.',
  },
];

export const HOME_STORAGE_KEY = 'hotsDrafter-tutorialSeen';
export const DRAFT_STORAGE_KEY = 'hotsDrafter-draftTutorialSeen';

export function shouldShowHomeTutorial(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(HOME_STORAGE_KEY) !== 'true';
}

export function shouldShowDraftTutorial(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DRAFT_STORAGE_KEY) !== 'true';
}
