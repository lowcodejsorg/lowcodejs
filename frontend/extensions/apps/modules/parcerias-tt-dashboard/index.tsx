import {
  DownloadIcon,
  FileTextIcon,
  ListIcon,
  RefreshCwIcon,
} from 'lucide-react';
import React from 'react';

import { ChartStatus } from './chart-status';
import { ChartYearly } from './chart-yearly';
import { ParceriasTtDashboardSkeleton } from './dashboard-skeleton';
import { StatusRowsDialog } from './status-rows-dialog';
import {
  useParceriasTtDashboardStats,
  type ParceriasTtDashboardStats,
  type ParceriasTtDashboardRowsTransfer,
} from './use-parcerias-tt-dashboard-stats';

import { PageHeader, PageShell } from '@/components/common/page-shell';
import { LoadError } from '@/components/common/route-status/load-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TABLE_SLUG = 'demandas-de-parcerias-e-tecnologia';

type RowsDialogFilter = {
  status: string | null;
  year?: string | null;
  transfer?: ParceriasTtDashboardRowsTransfer | null;
  title: string;
};

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value: string | number): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDisplayDate(value: string): string {
  if (!value) {
    return '-';
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
}

function formatPercent(value: number): string {
  return `${value.toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  })}%`;
}

function downloadHtmlFile({
  content,
  filename,
  mimeType,
}: {
  content: string;
  filename: string;
  mimeType: string;
}) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function createDashboardTablesHtml(
  data: ParceriasTtDashboardStats,
  startDate: string,
  endDate: string,
): string {
  const statusRows = data.status
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.label)}</td>
          <td>${item.value}</td>
          <td>${escapeHtml(formatPercent(item.percent))}</td>
        </tr>
      `,
    )
    .join('');
  const yearlyRows = data.yearly
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.year)}</td>
          <td>${item.withoutTransfer}</td>
          <td>${item.withTransfer}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <table>
      <tr><th colspan="3">Parcerias e Transferencia de Tecnologia</th></tr>
      <tr>
        <td><strong>Periodo</strong></td>
        <td>${escapeHtml(formatDisplayDate(startDate))}</td>
        <td>${escapeHtml(formatDisplayDate(endDate))}</td>
      </tr>
      <tr>
        <td><strong>Total geral</strong></td>
        <td colspan="2">${data.totals.demands}</td>
      </tr>
      <tr>
        <td><strong>Total sem TT</strong></td>
        <td colspan="2">${data.totals.withoutTransfer}</td>
      </tr>
      <tr>
        <td><strong>Total com TT</strong></td>
        <td colspan="2">${data.totals.withTransfer}</td>
      </tr>
    </table>
    <br />
    <table>
      <tr><th colspan="3">Tipo de Situacao</th></tr>
      <tr>
        <th>Situacao</th>
        <th>Quantidade</th>
        <th>Percentual</th>
      </tr>
      ${statusRows}
    </table>
    <br />
    <table>
      <tr><th colspan="3">Demandas gerais</th></tr>
      <tr>
        <th>Ano</th>
        <th>Sem Transferencia de Tecnologia</th>
        <th>Com Transferencia de Tecnologia</th>
      </tr>
      ${yearlyRows}
    </table>
  `;
}

function exportDashboardExcel(
  data: ParceriasTtDashboardStats,
  startDate: string,
  endDate: string,
) {
  const tableHtml = createDashboardTablesHtml(data, startDate, endDate);

  downloadHtmlFile({
    filename: `parcerias-tt-dashboard-${startDate}-${endDate}.xls`,
    mimeType: 'application/vnd.ms-excel;charset=utf-8;',
    content: `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
            th { background: #246b73; color: #ffffff; text-align: left; }
            td, th { border: 1px solid #cbd5e1; padding: 8px; }
          </style>
        </head>
        <body>${tableHtml}</body>
      </html>
    `,
  });
}

function getChartSvgHtml(testId: string): string {
  const svg = document.querySelector(
    `[data-test-id="${testId}"] svg`,
  ) as SVGSVGElement | null;

  return svg?.outerHTML ?? '';
}

function exportDashboardPdf(
  data: ParceriasTtDashboardStats,
  startDate: string,
  endDate: string,
) {
  const statusSvg = getChartSvgHtml('parcerias-tt-chart-status');
  const yearlySvg = getChartSvgHtml('parcerias-tt-chart-yearly');
  const tableHtml = createDashboardTablesHtml(data, startDate, endDate);
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Parcerias e Transferencia de Tecnologia</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #0f172a;
            background: #ffffff;
            font-family: Arial, sans-serif;
            font-size: 12px;
          }
          h1 {
            margin: 0 0 10px;
            color: #155f70;
            font-size: 18px;
            text-align: center;
            text-transform: uppercase;
          }
          .period {
            margin-bottom: 12px;
            color: #475569;
            text-align: center;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            page-break-inside: avoid;
          }
          .card {
            min-height: 430px;
            border: 1px solid #d9e2ec;
            border-radius: 8px;
            padding: 14px;
          }
          .card h2 {
            margin: 0 0 12px;
            border-left: 4px solid #246b73;
            padding-left: 10px;
            font-size: 14px;
          }
          .chart {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 320px;
          }
          .chart svg {
            width: 100%;
            max-height: 360px;
          }
          table {
            width: 100%;
            margin-top: 14px;
            border-collapse: collapse;
            page-break-inside: avoid;
          }
          th {
            background: #246b73;
            color: #ffffff;
            text-align: left;
          }
          td, th {
            border: 1px solid #cbd5e1;
            padding: 6px;
          }
          @media print {
            .tables { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <h1>Parcerias e Transferencia de Tecnologia</h1>
        <div class="period">
          Periodo: ${escapeHtml(formatDisplayDate(startDate))} ate ${escapeHtml(formatDisplayDate(endDate))}
        </div>
        <div class="grid">
          <section class="card">
            <h2>Tipo de Situacao</h2>
            <div class="chart">${statusSvg}</div>
          </section>
          <section class="card">
            <h2>Demandas gerais</h2>
            <div class="chart">${yearlySvg}</div>
          </section>
        </div>
        <div class="tables">${tableHtml}</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 300);
}

export default function ParceriasTtDashboardModule(): React.JSX.Element {
  const [startDate, setStartDate] = React.useState('2020-01-01');
  const [endDate, setEndDate] = React.useState(todayInputValue);
  const [selectedStatus, setSelectedStatus] = React.useState<string | null>(
    null,
  );
  const [rowsDialogFilter, setRowsDialogFilter] =
    React.useState<RowsDialogFilter | null>(null);

  const stats = useParceriasTtDashboardStats({ startDate, endDate });
  const openRowsDialog = (filter: RowsDialogFilter) => {
    setSelectedStatus(filter.status);
    setRowsDialogFilter(filter);
  };
  const transferLabel = (transfer: ParceriasTtDashboardRowsTransfer) =>
    transfer === 'withTransfer'
      ? 'Com Transferência de Tecnologia'
      : 'Sem Transferência de Tecnologia';
  const canExport = stats.status === 'success';
  const dashboardData = stats.status === 'success' ? stats.data : null;

  return (
    <PageShell data-test-id="module-parcerias-tt-dashboard">
      <PageShell.Header>
        <PageHeader
          title="Parcerias e Transferência de Tecnologia"
          className="w-full justify-center"
        />
      </PageShell.Header>

      <PageShell.Content className="bg-[#f7f9fb] p-5">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#155f70]">Demandas</h2>

          <Card>
            <CardContent className="flex flex-col gap-3 p-3 lg:min-h-[76px] lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <Label
                    htmlFor="parcerias-tt-start-date"
                    className="text-xs font-bold uppercase text-muted-foreground"
                  >
                    Periodo:
                  </Label>
                  <Input
                    id="parcerias-tt-start-date"
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="h-10 w-40 text-center font-semibold"
                  />
                </div>

                <span className="text-xs text-muted-foreground">até</span>

                <div className="flex items-center">
                  <Label
                    htmlFor="parcerias-tt-end-date"
                    className="sr-only"
                  >
                    Fim
                  </Label>
                  <Input
                    id="parcerias-tt-end-date"
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="h-10 w-40 text-center font-semibold"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => stats.refetch()}
                  disabled={stats.isFetching}
                  className="h-10 bg-[#246b73] px-6 font-semibold hover:bg-[#1d5960]"
                >
                  <RefreshCwIcon
                    className={
                      stats.isFetching ? 'size-4 animate-spin' : 'size-4'
                    }
                  />
                  Atualizar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="h-10 px-5 font-semibold"
                >
                  <a href={`/tables/${TABLE_SLUG}`}>
                    <ListIcon className="size-4" />
                    Listar
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canExport}
                  onClick={() => {
                    if (dashboardData) {
                      exportDashboardExcel(dashboardData, startDate, endDate);
                    }
                  }}
                  className="h-10 px-5 font-semibold"
                >
                  <DownloadIcon className="size-4" />
                  Excel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canExport}
                  onClick={() => {
                    if (dashboardData) {
                      exportDashboardPdf(dashboardData, startDate, endDate);
                    }
                  }}
                  className="h-10 px-5 font-semibold"
                >
                  <FileTextIcon className="size-4" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {stats.status === 'pending' && <ParceriasTtDashboardSkeleton />}

          {stats.status === 'error' && (
            <LoadError
              message={stats.error.message}
              refetch={() => stats.refetch()}
            />
          )}

          {stats.status === 'success' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartStatus
                total={stats.data.totals.demands}
                data={stats.data.status}
                onStatusSelect={(status) =>
                  openRowsDialog({
                    status,
                    title: status,
                  })
                }
              />
              <ChartYearly
                data={stats.data.yearly}
                totals={stats.data.totals}
                onYearlySelect={(year, transfer) =>
                  openRowsDialog({
                    status: null,
                    year,
                    transfer,
                    title: `${year} - ${transferLabel(transfer)}`,
                  })
                }
                onTransferSelect={(transfer) =>
                  openRowsDialog({
                    status: null,
                    transfer,
                    title: transferLabel(transfer),
                  })
                }
              />
            </div>
          )}
        </div>
      </PageShell.Content>

      <StatusRowsDialog
        open={Boolean(rowsDialogFilter)}
        status={rowsDialogFilter?.status ?? selectedStatus}
        year={rowsDialogFilter?.year}
        transfer={rowsDialogFilter?.transfer}
        title={rowsDialogFilter?.title}
        startDate={startDate}
        endDate={endDate}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedStatus(null);
            setRowsDialogFilter(null);
          }
        }}
      />
    </PageShell>
  );
}
