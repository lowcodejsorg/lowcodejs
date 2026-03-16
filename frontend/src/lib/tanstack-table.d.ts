import type { IField } from '@/lib/interfaces';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    label?: string;
    field?: IField;
  }

  interface TableMeta<TData> {
    slug?: string;
    persistKey?: string;
  }
}
