import React from 'react';
import type { IRow } from '@/lib/interfaces';
import type { DocBlock } from '@/lib/document-helpers';
import { getStr } from '@/lib/document-helpers';
import { Button } from '../ui/button';
import { EllipsisVerticalIcon } from 'lucide-react';
import { useParams, useRouter } from '@tanstack/react-router';

export function DocumentRow({
    row,
    blocks,
    indentPx,
}: {
    row: IRow;
    blocks: DocBlock[];
    indentPx: number;
    leafLabel?: string | null;
}) {

    const router = useRouter();
    const { slug } = useParams({
        from: '/_private/tables/$slug/',
    });

    return (
        <article style={{ marginLeft: indentPx }} className="py-3">
        {/* {leafLabel ? (
            <div className="mb-3 text-xs text-muted-foreground">{leafLabel}</div>
        ) : null} */}
        <div className="flex flex-row justify-end">
            <Button
                variant="ghost"
                className="p-0 cursor-pointer"
                onClick={() => {
                    router.navigate({
                    to: '/tables/$slug/row/$rowId',
                    params: { slug, rowId: row._id },
                    });
                }}
                >
                <EllipsisVerticalIcon />
            </Button>
        </div>
        
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
