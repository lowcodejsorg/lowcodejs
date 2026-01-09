import React from 'react';
import type { IRow } from '@/lib/interfaces';
import type { DocBlock } from '@/lib/document-helpers';
import { getStr } from '@/lib/document-helpers';

export function DocumentRow({
    row,
    blocks,
    indentPx,
    leafLabel,
}: {
    row: IRow;
    blocks: DocBlock[];
    indentPx: number;
    leafLabel?: string | null;
}) {
    return (
        <article style={{ marginLeft: indentPx }} className="py-6">
        {/* {leafLabel ? (
            <div className="mb-3 text-xs text-muted-foreground">{leafLabel}</div>
        ) : null} */}
        
        <div className="space-y-8">
        {blocks.map((b) => {
            const title = getStr((row as any)?.[b.titleField.slug]).trim();
            if (!title) return null;
            
            const body = b.bodyField ? getStr((row as any)?.[b.bodyField.slug]).trim() : '';
            if (!body) return null;
            
            return (
                <section key={`${row._id}-${b.id}`} className="space-y-2">
                <h2 className="text-base font-semibold leading-6">{title}</h2>
                <p className="text-sm leading-6 text-foreground/90 whitespace-pre-wrap">
                {body}
                </p>
                </section>
            );
        })}
        </div>
        </article>
    );
}
