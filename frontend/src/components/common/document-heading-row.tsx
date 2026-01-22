import React from 'react';

import { cn } from '@/lib/utils';

export function DocumentHeadingRow({
  id,
  level,
  className,
  children,
  icon,
}: {
  id: string;
  level: number;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}): React.JSX.Element {
  const headingStyles: Record<number, string> = {
    2: 'text-2xl font-bold mt-8',
    3: 'text-xl font-semibold mt-6',
    4: 'text-lg font-semibold mt-4',
    5: 'text-base font-semibold mt-3',
    6: 'text-sm font-semibold mt-2',
  };

  const Tag = `h${level}` as keyof JSX.IntrinsicElements as React.ElementType;

  return (
    <Tag
      id={id}
      className={cn(className, headingStyles[level])}
    >
      <span className="inline-flex items-center gap-2">
        {icon ? <span className="inline-flex opacity-70">{icon}</span> : null}
        <span>{children}</span>
      </span>
    </Tag>
  );
}
