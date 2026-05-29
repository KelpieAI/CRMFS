import { useEffect, useRef } from 'react';
import { VERSION_STRING } from '../lib/version';
import { KELPIE_LOGO_PATHS } from './kelpieLogoPaths';

interface LoadingScreenProps {
  onComplete: () => void;
}

const SPLASH_DURATION_MS = 3000;
const STROKE_DRAW_MS = 1500;
const FILL_MS = 400;
const GROUP_STAGGER_S = [0, 0.3, 0.7] as const;

function groupIndexForPath(pathIndex: number, total: number): 0 | 1 | 2 {
  const perGroup = Math.ceil(total / 3);
  if (pathIndex < perGroup) return 0;
  if (pathIndex < perGroup * 2) return 1;
  return 2;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onComplete();
    }, SPLASH_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const paths = svg.querySelectorAll<SVGPathElement>('.kelpie-logo-path');
    const total = paths.length;

    paths.forEach((path, index) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;

      const group = groupIndexForPath(index, total);
      const strokeDelay = GROUP_STAGGER_S[group];
      const fillDelay = strokeDelay + STROKE_DRAW_MS / 1000;

      path.style.animation = [
        `loading-stroke-draw ${STROKE_DRAW_MS}ms ease-in-out ${strokeDelay}s forwards`,
        `loading-fill-in ${FILL_MS}ms ease-in-out ${fillDelay}s forwards`,
      ].join(', ');
    });
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white"
      role="status"
      aria-live="polite"
      aria-label="Loading CRMFS"
    >
      <div className="flex flex-col items-center px-6">
        <div className="relative mb-8 flex h-[130px] w-[130px] items-center justify-center">
          <svg
            ref={svgRef}
            viewBox="0 0 500 500"
            width={130}
            height={130}
            className="overflow-visible"
            aria-hidden
          >
            {KELPIE_LOGO_PATHS.map((path, index) => (
              <path
                key={index}
                className="kelpie-logo-path"
                d={path.d}
                transform={path.transform}
                fill="transparent"
                stroke="#14B7A6"
                strokeWidth={2}
              />
            ))}
          </svg>
        </div>

        <div className="loading-text-fade flex flex-col items-center text-center">
          <p className="text-2xl font-medium text-[#1a1a1a]">Kelpie AI</p>
          <p className="mt-2 text-xs text-[#888]">
            Built <span className="text-[#14B7A6]">pro bono</span> for the Falkirk Central Mosque
          </p>
        </div>

        <div className="loading-bar-track mt-10 h-0.5 w-[180px] overflow-hidden rounded-full bg-[#f0f0f0]">
          <div className="loading-bar-fill h-full rounded-full bg-[#D4AF37]" />
        </div>
      </div>

      <p className="loading-version absolute bottom-8 text-[11px] text-[#ccc]">
        {VERSION_STRING} · CRMFS
      </p>
    </div>
  );
}
