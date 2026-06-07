import { DownloadIcon, FileTextIcon, PrinterIcon } from 'lucide-react';

import {
  useParceriasTtDashboardRows,
  type ParceriasTtDashboardRow,
  type ParceriasTtDashboardRowsTransfer,
} from './use-parcerias-tt-dashboard-stats';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StatusRowsDialogProps {
  open: boolean;
  status: string | null;
  year?: string | null;
  transfer?: ParceriasTtDashboardRowsTransfer | null;
  title?: string;
  startDate: string;
  endDate: string;
  onOpenChange: (open: boolean) => void;
}

const DEMANDAS_TABLE_SLUG = 'demandas-de-parcerias-e-tecnologia';

function formatDate(value: string | null): string {
  if (!value) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildTableHtml(
  title: string,
  rows: ParceriasTtDashboardRow[],
): string {
  const body = rows
    .map(
      (row, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(row.legacyId)}</td>
          <td>${formatDate(row.date)}</td>
          <td>${escapeHtml(row.title)}</td>
          <td>${escapeHtml(row.status)}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1f2937; padding: 28px; }
          h1 { color: #1f6972; font-size: 20px; margin: 0 0 18px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #246b73; color: #fff; text-align: left; padding: 8px; }
          td { border: 1px solid #cbd5e1; padding: 7px 8px; }
          tr:nth-child(even) td { background: #f8fafc; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>ID</th>
              <th>Data</th>
              <th>Titulo</th>
              <th>Situacao</th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </body>
    </html>
  `;
}

function openPrintDocument(
  title: string,
  rows: ParceriasTtDashboardRow[],
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(buildTableHtml(title, rows));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function downloadExcel(title: string, rows: ParceriasTtDashboardRow[]): void {
  const html = buildTableHtml(title, rows);
  const blob = new Blob([html], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}

export function StatusRowsDialog({
  open,
  status,
  year,
  transfer,
  title: customTitle,
  startDate,
  endDate,
  onOpenChange,
}: StatusRowsDialogProps): React.JSX.Element {
  const rowsQuery = useParceriasTtDashboardRows({
    startDate,
    endDate,
    status,
    year,
    transfer,
    open,
  });
  const rows = rowsQuery.data?.rows ?? [];
  const title = `Demandas: ${customTitle ?? status ?? '-'}. Qtd: ${
    rowsQuery.data?.total ?? 0
  }`;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="max-h-[92vh] w-[min(1180px,calc(100vw-2rem))] !max-w-[min(1180px,calc(100vw-2rem))] gap-0 overflow-hidden p-0 sm:!max-w-[min(1180px,calc(100vw-2rem))]"
        showCloseButton={false}
      >
        <DialogHeader className="flex-row items-center justify-between gap-4 bg-[#246b73] px-4 py-3 text-white">
          <DialogTitle className="min-w-0 flex-1 text-base font-bold leading-6 text-white">
            {title}
          </DialogTitle>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!rows.length}
              onClick={() => downloadExcel(title, rows)}
            >
              <DownloadIcon className="size-4" />
              Excel
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!rows.length}
              onClick={() => openPrintDocument(title, rows)}
            >
              <FileTextIcon className="size-4" />
              PDF
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!rows.length}
              onClick={() => openPrintDocument(title, rows)}
            >
              <PrinterIcon className="size-4" />
              Imprimir
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(92vh-56px)] overflow-auto bg-white p-4">
          {rowsQuery.status === 'pending' && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Carregando demandas...
            </div>
          )}

          {rowsQuery.status === 'error' && (
            <div className="py-16 text-center text-sm text-destructive">
              {rowsQuery.error.message}
            </div>
          )}

          {rowsQuery.status === 'success' && (
            <div className="overflow-x-auto">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="w-24">ID</TableHead>
                    <TableHead className="w-32">Data</TableHead>
                    <TableHead>Titulo</TableHead>
                    <TableHead className="w-64">Situacao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <a
                          href={`/tables/${DEMANDAS_TABLE_SLUG}/row?_id=${row.id}&mode=view`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[#1f6972] hover:underline"
                        >
                          {row.legacyId}
                        </a>
                      </TableCell>
                      <TableCell>{formatDate(row.date)}</TableCell>
                      <TableCell className="whitespace-normal leading-5">
                        {row.title}
                      </TableCell>
                      <TableCell className="whitespace-normal leading-5">
                        {row.status}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
