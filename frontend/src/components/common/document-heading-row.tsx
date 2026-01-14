import { cn } from '@/lib/utils';
import React from 'react';

export function DocumentHeadingRow({
    id,
    level,
    className,
    children,
  }: {
    id: string;
    level: number;
    className?: string;
    children: React.ReactNode;
  }) {

    const headingStyles: Record<number, string> = {
      2: "text-2xl font-bold mt-8",
      3: "text-xl font-semibold mt-6",
      4: "text-lg font-semibold mt-4",
      5: "text-base font-semibold mt-3",
      6: "text-sm font-semibold mt-2",
    };

    const Tag = (`h${level}` as keyof JSX.IntrinsicElements) as React.ElementType;
  
    return <Tag id={id} className={cn(className, headingStyles[level])}>{children}</Tag>;
}