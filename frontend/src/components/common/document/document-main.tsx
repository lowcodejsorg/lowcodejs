import { DocumentRow } from './document-row';

import type { DocBlock } from '@/lib/document-helpers';
import { getRowLeafId } from '@/lib/document-helpers';
import type { IRow } from '@/lib/interfaces';

interface DocumentMainProps {
  rows: Array<IRow>;
  total: number;
  filterLabel?: string | null;
  blocks: Array<DocBlock>;
  getIndentPx: (row: IRow) => number;
  getLeafLabel: (row: IRow) => string | null;
  getHeadingLevel: (row: IRow) => number;
  categorySlug: string;
}

export function DocumentMain({
  rows,
  total,
  filterLabel,
  blocks,
  getIndentPx,
  getLeafLabel,
  getHeadingLevel,
  categorySlug,
}: DocumentMainProps): React.JSX.Element {
  return (
    <main
      data-slot="document-main"
      className="p-4 w-full"
    >
      <div className="no-print mb-3 flex flex-wrap items-center gap-3 pr-10">
        <div className="text-sm text-muted-foreground">
          Mostrando{' '}
          <span className="font-medium text-foreground">{rows.length}</span> de{' '}
          <span className="font-medium text-foreground">{total}</span>
        </div>

        {filterLabel && (
          <div className="text-sm">
            Filtro: <span className="font-medium">{filterLabel}</span>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div>
          {rows.map((row, index) => {
            let prevLeafId: string | null = null;
            if (index > 0) {
              prevLeafId = getRowLeafId(rows[index - 1], categorySlug);
            }
            const leafId = getRowLeafId(row, categorySlug);
            const showHeading = leafId !== prevLeafId;

            return (
              <DocumentRow
                key={row._id}
                row={row}
                blocks={blocks}
                indentPx={getIndentPx(row)}
                leafLabel={getLeafLabel(row)}
                headingLevel={getHeadingLevel(row)}
                categorySlug={categorySlug}
                showHeading={showHeading}
              />
            );
          })}
        </div>
      )}
      {rows.length === 0 && (
        <div className="text-sm text-muted-foreground">
          Nenhum registro encontrado para este filtro.
        </div>
      )}
    </main>
  );
}
