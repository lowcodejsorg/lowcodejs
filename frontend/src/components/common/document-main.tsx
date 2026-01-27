import { DocumentRow } from '@/components/common/document-row';
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
  getLeafIcon?: (row: IRow) => React.ReactNode | null;
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
  getLeafIcon,
  categorySlug,
}: DocumentMainProps): React.JSX.Element {
  return (
    <main className="p-4 w-full">
      <div className="no-print mb-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando{' '}
          <span className="font-medium text-foreground">{rows.length}</span> de{' '}
          <span className="font-medium text-foreground">{total}</span>
        </div>

        {filterLabel ? (
          <div className="text-sm">
            Filtro: <span className="font-medium">{filterLabel}</span>
          </div>
        ) : null}
      </div>

      {rows.length ? (
        <div className="divide-y divide-border/40">
          {rows.map((row, index) => {
            const leafId = getRowLeafId(row, categorySlug);
            const prevLeafId =
              index > 0 ? getRowLeafId(rows[index - 1], categorySlug) : null;
            const showHeading = leafId !== prevLeafId;

            return (
              <DocumentRow
                key={row._id}
                row={row}
                blocks={blocks}
                indentPx={getIndentPx(row)}
                leafLabel={getLeafLabel(row)}
                headingLevel={getHeadingLevel(row)}
                leafIcon={getLeafIcon ? getLeafIcon(row) : null}
                categorySlug={categorySlug}
                showHeading={showHeading}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          Nenhum registro encontrado para este filtro.
        </div>
      )}
    </main>
  );
}
