import { TrendingUpIcon } from 'lucide-react';
import type * as React from 'react';

import { cn } from '@/lib/utils';

interface AppPreviewProps {
  className?: string;
}

interface MockRow {
  cells: Array<string>;
  status: 'on' | 'off';
}

const BAR_HEIGHTS = [34, 48, 72, 56, 84];
const TECH_GREEN = '#1f6f55';
const TECH_GREEN_LIGHT = '#39b378';

const ROWS: Array<MockRow> = [
  { cells: ['w-24', 'w-16', 'w-12'], status: 'on' },
  { cells: ['w-20', 'w-24', 'w-10'], status: 'off' },
];

export function AppPreview({ className }: AppPreviewProps): React.JSX.Element {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none select-none', className)}
    >
      <div className="shadow-soft-lg w-[27rem] max-w-full rotate-[-4deg] rounded-2xl border border-white/15 bg-[#11100f]/92 p-3 ring-1 ring-white/10">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#171513]">
          <div className="flex items-center gap-2 border-b border-white/10 bg-black/55 px-4 py-3">
            <span className="h-2 w-24 rounded-full bg-white/80" />
            <span className="ml-auto h-2 w-12 rounded-full bg-white/18" />
            <span
              className="h-2 w-10 rounded-full"
              style={{ backgroundColor: TECH_GREEN_LIGHT }}
            />
          </div>

          <div className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-32 rounded-full bg-white/28" />
              <span className="ml-auto h-2.5 w-12 rounded-full bg-white/14" />
              <span className="h-2.5 w-10 rounded-full bg-white/14" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="rounded-lg border border-white/10 bg-white/8 px-3 py-2">
                <span
                  className="block h-2 w-8 rounded-full"
                  style={{ backgroundColor: TECH_GREEN_LIGHT }}
                />
                <span className="mt-2 block h-2 w-12 rounded-full bg-white/18" />
                <span className="mt-2 block h-3 w-8 rounded-full bg-white/28" />
              </span>
              <span className="rounded-lg border border-white/10 bg-white/8 px-3 py-2">
                <span
                  className="block h-2 w-8 rounded-full"
                  style={{ backgroundColor: TECH_GREEN }}
                />
                <span className="mt-2 block h-2 w-12 rounded-full bg-white/18" />
                <span className="mt-2 block h-3 w-10 rounded-full bg-white/28" />
              </span>
              <span className="rounded-lg border border-white/10 bg-white/8 px-3 py-2">
                <span className="block h-2 w-8 rounded-full bg-white/70" />
                <span className="mt-2 block h-2 w-16 rounded-full bg-white/18" />
                <span className="mt-2 block h-3 w-7 rounded-full bg-white/28" />
              </span>
            </div>
            <div className="grid grid-cols-[1fr_92px] gap-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="h-2 w-24 rounded-full bg-white/24" />
                  <span
                    className="h-2 w-10 rounded-full"
                    style={{ backgroundColor: TECH_GREEN_LIGHT }}
                  />
                </div>
                <div className="flex h-24 items-end justify-between gap-2 border-b border-l border-white/10 px-2 pb-2">
                  {BAR_HEIGHTS.map((height, index) => (
                    <span
                      key={index}
                      className="w-5 rounded-t-md"
                      style={{
                        height,
                        backgroundColor:
                          index % 2 === 0 ? TECH_GREEN_LIGHT : TECH_GREEN,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/20 p-3">
                <svg
                  viewBox="0 0 80 80"
                  className="size-20"
                  role="img"
                  aria-label="Distribuição de demandas"
                >
                  <circle
                    cx="40"
                    cy="40"
                    r="28"
                    fill="none"
                    stroke="rgba(255,255,255,0.16)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="28"
                    fill="none"
                    stroke={TECH_GREEN_LIGHT}
                    strokeDasharray="118 176"
                    strokeLinecap="round"
                    strokeWidth="12"
                    transform="rotate(-90 40 40)"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="28"
                    fill="none"
                    stroke={TECH_GREEN}
                    strokeDasharray="44 176"
                    strokeDashoffset="-124"
                    strokeLinecap="round"
                    strokeWidth="12"
                    transform="rotate(-90 40 40)"
                  />
                </svg>
                <span className="mt-1 h-2 w-14 rounded-full bg-white/20" />
              </div>
            </div>
            {ROWS.map((row, index) => (
              <div
                key={index}
                className="flex items-center gap-3"
              >
                <span className="size-6 shrink-0 rounded-md bg-white/10" />
                {row.cells.map((width, cellIndex) => (
                  <span
                    key={cellIndex}
                    className={cn('h-2 rounded-full bg-white/18', width)}
                  />
                ))}
                <span
                  className={cn(
                    'ml-auto h-4 w-12 shrink-0 rounded-full',
                    row.status === 'on' && 'bg-[#39b378]',
                    row.status === 'off' && 'bg-white/12',
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="shadow-soft-lg absolute -top-6 -left-10 rotate-[3deg] rounded-2xl border border-white/20 bg-[#1f6f55] p-1">
        <div className="flex items-center gap-3 rounded-xl bg-black/12 px-4 py-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/18 text-white">
            <TrendingUpIcon className="size-4" />
          </span>
          <div>
            <p className="text-base font-semibold text-white">406</p>
            <p className="text-[11px] text-white/70">demandas TT</p>
          </div>
        </div>
      </div>
    </div>
  );
}
