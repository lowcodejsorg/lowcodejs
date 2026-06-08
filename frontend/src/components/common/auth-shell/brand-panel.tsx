import { FlaskConicalIcon, HandshakeIcon, ShieldCheckIcon } from 'lucide-react';
import type * as React from 'react';

import { AppPreview } from './app-preview';
import { PittLogo } from './pitt-logo';

import { Logo } from '@/components/common/layout/logo';
import { cn } from '@/lib/utils';

interface BrandPanelProps {
  className?: string;
}

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FEATURES: Array<Feature> = [
  {
    icon: <ShieldCheckIcon className="size-4" />,
    title: 'Propriedade Intelectual',
    description: 'Proteja invenções, marcas, programas e tecnologias.',
  },
  {
    icon: <HandshakeIcon className="size-4" />,
    title: 'Transferência de Tecnologia',
    description: 'Acompanhe parcerias, contratos e instrumentos.',
  },
  {
    icon: <FlaskConicalIcon className="size-4" />,
    title: 'Laboratórios',
    description: 'Conecte estruturas científicas da UFG à sociedade.',
  },
];

export function BrandPanel({ className }: BrandPanelProps): React.JSX.Element {
  return (
    <aside
      data-slot="brand-panel"
      className={cn(
        'relative isolate flex-col justify-between overflow-hidden bg-[#050807] p-10 xl:p-14',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(154,132,111,0.72)_0%,rgba(76,70,65,0.58)_30%,rgba(12,12,11,0.96)_66%),linear-gradient(145deg,#050807_0%,#272522_50%,#5b4938_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,5,0.98)_0%,rgba(14,14,13,0.78)_42%,rgba(58,49,42,0.34)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-20 size-96 rounded-full bg-[#d3b38a]/18 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-28 size-[28rem] rounded-full bg-[#7d5b3d]/32 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-0 left-0 h-28 bg-[linear-gradient(170deg,transparent_0%,transparent_52%,rgba(211,179,138,0.16)_53%,rgba(211,179,138,0.16)_100%)]"
      />

      <AppPreview className="absolute right-[-2.5rem] bottom-12 z-[1] hidden lg:block" />

      <div className="animate-rise-in relative z-10">
        <span className="inline-flex rounded-xl bg-black/45 px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.32)] ring-1 ring-white/15 backdrop-blur-sm">
          <PittLogo className="h-14 max-w-[250px]" />
        </span>
      </div>

      <div className="relative z-10 max-w-md">
        <p className="animate-rise-in mb-4 inline-flex rounded-full bg-[#d3b38a] px-3 py-1 text-xs font-bold tracking-[0.16em] text-[#171412] uppercase shadow-[0_10px_24px_rgba(211,179,138,0.24)]">
          PRPI / Universidade Federal de Goiás
        </p>
        <h2 className="animate-rise-in heading-section text-white">
          Conecte pesquisa, inovação e{' '}
          <span className="text-[#d3b38a]">tecnologia</span>
        </h2>
        <p className="animate-rise-in stagger-item mt-4 max-w-md text-lg leading-relaxed font-medium text-white/90">
          Gerencie demandas, propriedades intelectuais, parcerias e laboratórios
          em um ambiente integrado da PRPI/UFG.
        </p>

        <ul className="mt-10 space-y-5">
          {FEATURES.map((feature, index) => {
            const itemStyle: React.CSSProperties = {
              animationDelay: `${(index + 2) * 80}ms`,
            };

            return (
              <li
                key={feature.title}
                style={itemStyle}
                className="animate-rise-in flex items-start gap-3"
              >
                <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-[#d3b38a] backdrop-blur-sm">
                  {feature.icon}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">
                    {feature.title}
                  </p>
                  <p className="text-[13px] leading-relaxed text-white/80">
                    {feature.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="relative z-10 flex items-center justify-between gap-4 text-sm text-white/80">
        <span className="flex items-center gap-2">
          <span className="animate-pulse-soft inline-block size-2 rounded-full bg-[#d3b38a]" />
          pitt.prpi.ufg.br
        </span>
        <span className="flex items-center gap-2 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
          <span>powered by</span>
          <Logo className="h-4 w-auto" />
        </span>
      </div>
    </aside>
  );
}
