import React from 'react';
import type { IRow } from '@/lib/interfaces';
import type { DocBlock } from '@/lib/document-helpers';
import { buildLabelMap, firstCategoryField, getStr, rowLeafLabel } from '@/lib/document-helpers';
import { Button } from '../ui/button';
import { EllipsisVerticalIcon } from 'lucide-react';
import { useParams, useRouter } from '@tanstack/react-router';
import { useMemo } from 'react';
import { DocumentHeadingRow } from './document-heading-row';

export function DocumentRow({
    row,
    blocks,
    indentPx,
    leafLabel,
    headingLevel,
}: {
    row: IRow;
    blocks: DocBlock[];
    indentPx: number;
    leafLabel?: string | null;
    headingLevel?: number;
}) {

    const router = useRouter();
    const { slug } = useParams({
        from: '/_private/tables/$slug/',
    });


    return (
        <article style={{ marginLeft: indentPx }} className="my-2  relative">
        
            <div className="flex flex-row justify-end absolute top-0 right-0">
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
            
            <div className="space-y-4">
                {leafLabel ? (
                    <DocumentHeadingRow
                        level={headingLevel ?? 2}
                    >
                        {leafLabel}
                </DocumentHeadingRow>
                ) : null} 
                {blocks.map((b) => {
                    const title = getStr((row as any)?.[b.titleField.slug]).trim();
                    
                    const body = b.bodyField ? getStr((row as any)?.[b.bodyField.slug]).trim() : '';
                    if (!body) return null;
                    
                    return (
                        <section key={`${row._id}-${b.id}`} className="space-y-2">
                            {title ? <h2 className="text-base font-semibold leading-none text-gray-700">{title}</h2> : null}
                            <p className="text-sm leading-4 text-gray-700 whitespace-pre-wrap">
                                {body}
                            </p>
                        </section>
                    );
                })}
            </div>
        </article>
    );
}
