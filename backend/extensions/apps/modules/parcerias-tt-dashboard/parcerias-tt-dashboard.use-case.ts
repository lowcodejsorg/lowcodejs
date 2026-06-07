/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
import { getDataConnection } from '@config/database.config';

import type {
  ParceriasTtDashboardQuery,
  ParceriasTtDashboardRowsQuery,
} from './parcerias-tt-dashboard.validator';

const TABLE_SLUG = 'demandas-de-parcerias-e-tecnologia';
const DATE_FIELD = 'data-de-criacao-legado';
const STATUS_FIELD = 'situacao';
const STATUS_LEGACY_FIELD = 'situacao-legado';
const TRANSFER_FIELD = 'tem-transferencia-de-tecnologia';
const LEGACY_ID_FIELD = 'id-legado-joomla';
const TITLE_FIELD = 'nome-do(a)-projeto-ou-tecnologia';

const COLORS = [
  '#0f766e',
  '#3b82f6',
  '#7c3aed',
  '#ea580c',
  '#dc2626',
  '#0891b2',
  '#6d28d9',
  '#16a34a',
  '#d97706',
  '#475569',
  '#0f766e',
  '#2563eb',
];

type RawAggregateRow = {
  _id: string | null;
  count: number;
};

type RawYearlyRow = {
  _id: {
    year: number;
    transfer: string;
  };
  count: number;
};

export type ParceriasTtDashboardResponse = {
  totals: {
    demands: number;
    withTransfer: number;
    withoutTransfer: number;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  status: Array<{
    label: string;
    value: number;
    percent: number;
    fill: string;
  }>;
  yearly: Array<{
    year: string;
    withoutTransfer: number;
    withTransfer: number;
  }>;
};

export type ParceriasTtDashboardRow = {
  id: string;
  legacyId: string;
  date: string | null;
  title: string;
  status: string;
};

export type ParceriasTtDashboardRowsResponse = {
  status: string;
  total: number;
  rows: ParceriasTtDashboardRow[];
};

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function startOfYear(year: number): Date {
  return startOfDay(new Date(year, 0, 1));
}

function endOfYear(year: number): Date {
  return endOfDay(new Date(year, 11, 31));
}

function laterDate(first: Date, second: Date): Date {
  return first > second ? first : second;
}

function earlierDate(first: Date, second: Date): Date {
  return first < second ? first : second;
}

function defaultEndDate(): Date {
  return endOfDay(new Date());
}

function defaultStartDate(): Date {
  return startOfDay(new Date('2020-01-01T00:00:00.000Z'));
}

function fieldBySlug(fields: IField[], slug: string): IField | undefined {
  return fields.find((field) => field.slug === slug);
}

function dropdownLabel(
  field: IField | undefined,
  value: unknown,
): string | null {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const item = field?.dropdown?.find((option) => option.id === String(raw));
  return item?.label ?? String(raw);
}

function dropdownValuesByLabel(
  field: IField | undefined,
  label: string,
): string[] {
  return (
    field?.dropdown
      ?.filter((option) => option.label === label)
      .map((option) => option.id) ?? []
  );
}

function normalizeTransfer(
  label: string | null,
): 'withTransfer' | 'withoutTransfer' {
  return label?.trim().toLowerCase() === 'sim'
    ? 'withTransfer'
    : 'withoutTransfer';
}

function normalizeRowId(value: unknown): string {
  if (!value) return '';

  if (typeof value === 'string') return value;

  if (
    typeof value === 'object' &&
    'toHexString' in value &&
    typeof value.toHexString === 'function'
  ) {
    return value.toHexString();
  }

  if (
    typeof value === 'object' &&
    'buffer' in value &&
    value.buffer &&
    typeof value.buffer === 'object'
  ) {
    const bytes = Object.values(value.buffer as Record<string, number>);
    return Buffer.from(bytes).toString('hex');
  }

  return String(value);
}

@Service()
export default class ParceriasTtDashboardUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

  async execute(
    payload: ParceriasTtDashboardQuery,
  ): Promise<Either<HTTPException, ParceriasTtDashboardResponse>> {
    try {
      const table = await this.tableRepository.findBySlug(TABLE_SLUG);

      if (!table) {
        return left(
          HTTPException.NotFound(
            'Tabela de demandas de parcerias e tecnologia não encontrada',
            'PARCERIAS_TT_TABLE_NOT_FOUND',
          ),
        );
      }

      const startDate = payload.startDate
        ? startOfDay(payload.startDate)
        : defaultStartDate();
      const endDate = payload.endDate
        ? endOfDay(payload.endDate)
        : defaultEndDate();

      const statusField = fieldBySlug(table.fields, STATUS_FIELD);
      const transferField = fieldBySlug(table.fields, TRANSFER_FIELD);

      const dataConn = getDataConnection();
      const collection = dataConn.collection(TABLE_SLUG);

      const baseMatch = {
        trashedAt: null,
        [DATE_FIELD]: {
          $gte: startDate,
          $lte: endDate,
        },
      };

      const [total, statusRows, yearlyRows] = await Promise.all([
        collection.countDocuments(baseMatch),
        collection
          .aggregate<RawAggregateRow>([
            { $match: baseMatch },
            {
              $project: {
                status: {
                  $ifNull: [
                    { $arrayElemAt: [`$${STATUS_FIELD}`, 0] },
                    `$${STATUS_LEGACY_FIELD}`,
                  ],
                },
              },
            },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ])
          .toArray(),
        collection
          .aggregate<RawYearlyRow>([
            { $match: baseMatch },
            {
              $project: {
                year: { $year: `$${DATE_FIELD}` },
                transfer: { $arrayElemAt: [`$${TRANSFER_FIELD}`, 0] },
              },
            },
            {
              $group: {
                _id: { year: '$year', transfer: '$transfer' },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.year': 1 } },
          ])
          .toArray(),
      ]);

      const status = statusRows.map((row, index) => {
        const label =
          dropdownLabel(statusField, row._id) ?? row._id ?? 'Nao informado';
        return {
          label,
          value: row.count,
          percent:
            total > 0 ? Number(((row.count / total) * 100).toFixed(1)) : 0,
          fill: COLORS[index % COLORS.length],
        };
      });

      const yearlyMap = new Map<
        string,
        { year: string; withoutTransfer: number; withTransfer: number }
      >();

      let withTransfer = 0;
      let withoutTransfer = 0;

      for (const row of yearlyRows) {
        const year = String(row._id.year);
        const transferLabel = dropdownLabel(transferField, row._id.transfer);
        const transferKey = normalizeTransfer(transferLabel);
        const existing =
          yearlyMap.get(year) ??
          ({
            year,
            withoutTransfer: 0,
            withTransfer: 0,
          } satisfies {
            year: string;
            withoutTransfer: number;
            withTransfer: number;
          });

        existing[transferKey] += row.count;
        yearlyMap.set(year, existing);

        if (transferKey === 'withTransfer') {
          withTransfer += row.count;
        } else {
          withoutTransfer += row.count;
        }
      }

      return right({
        totals: {
          demands: total,
          withTransfer,
          withoutTransfer,
        },
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        status,
        yearly: Array.from(yearlyMap.values()),
      });
    } catch (error) {
      console.error('[apps/parcerias-tt-dashboard > stats][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro ao calcular o dashboard de parcerias e transferência de tecnologia',
          'PARCERIAS_TT_DASHBOARD_ERROR',
        ),
      );
    }
  }

  async rows(
    payload: ParceriasTtDashboardRowsQuery,
  ): Promise<Either<HTTPException, ParceriasTtDashboardRowsResponse>> {
    try {
      const table = await this.tableRepository.findBySlug(TABLE_SLUG);

      if (!table) {
        return left(
          HTTPException.NotFound(
            'Tabela de demandas de parcerias e tecnologia não encontrada',
            'PARCERIAS_TT_TABLE_NOT_FOUND',
          ),
        );
      }

      const startDate = payload.startDate
        ? startOfDay(payload.startDate)
        : defaultStartDate();
      const endDate = payload.endDate
        ? endOfDay(payload.endDate)
        : defaultEndDate();
      const statusField = fieldBySlug(table.fields, STATUS_FIELD);
      const transferField = fieldBySlug(table.fields, TRANSFER_FIELD);
      const statusMatch = payload.status
        ? this.buildStatusMatch(statusField, payload.status)
        : [];
      const transferMatch = payload.transfer
        ? this.buildTransferMatch(transferField, payload.transfer)
        : undefined;
      const dateRange = payload.year
        ? {
            $gte: laterDate(startDate, startOfYear(payload.year)),
            $lte: earlierDate(endDate, endOfYear(payload.year)),
          }
        : {
            $gte: startDate,
            $lte: endDate,
          };

      const dataConn = getDataConnection();
      const collection = dataConn.collection(TABLE_SLUG);
      const rows = await collection
        .find({
          trashedAt: null,
          [DATE_FIELD]: dateRange,
          ...(statusMatch.length ? { $or: statusMatch } : {}),
          ...(transferMatch ? { [TRANSFER_FIELD]: transferMatch } : {}),
        })
        .sort({ [DATE_FIELD]: -1 })
        .toArray();

      return right({
        status:
          payload.status ??
          (payload.transfer === 'withTransfer'
            ? 'Com Transferência de Tecnologia'
            : 'Sem Transferência de Tecnologia'),
        total: rows.length,
        rows: rows.map((row) => {
          const statusValue =
            Array.isArray(row[STATUS_FIELD]) && row[STATUS_FIELD].length
              ? row[STATUS_FIELD][0]
              : row[STATUS_LEGACY_FIELD];

          return {
            id: normalizeRowId(row._id),
            legacyId: row[LEGACY_ID_FIELD] ? `#${row[LEGACY_ID_FIELD]}` : '-',
            date:
              row[DATE_FIELD] instanceof Date
                ? row[DATE_FIELD].toISOString()
                : null,
            title: row[TITLE_FIELD] ?? row.nome ?? '-',
            status:
              dropdownLabel(statusField, statusValue) ??
              row[STATUS_LEGACY_FIELD] ??
              payload.status,
          };
        }),
      });
    } catch (error) {
      console.error('[apps/parcerias-tt-dashboard > rows][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro ao listar demandas por situação',
          'PARCERIAS_TT_DASHBOARD_ROWS_ERROR',
        ),
      );
    }
  }

  private buildStatusMatch(field: IField | undefined, status: string) {
    const statusValues = dropdownValuesByLabel(field, status);

    if (status === 'Nao informado') {
      return [
        { [STATUS_FIELD]: { $in: [null, []] } },
        { [STATUS_LEGACY_FIELD]: { $in: [null, ''] } },
      ];
    }

    return [
      ...(statusValues.length
        ? [{ [STATUS_FIELD]: { $in: statusValues } }]
        : []),
      { [STATUS_LEGACY_FIELD]: status },
    ];
  }

  private buildTransferMatch(
    field: IField | undefined,
    transfer: ParceriasTtDashboardRowsQuery['transfer'],
  ) {
    const withTransferValues = dropdownValuesByLabel(field, 'Sim');

    if (transfer === 'withTransfer') {
      return { $in: withTransferValues };
    }

    return { $nin: withTransferValues };
  }
}
