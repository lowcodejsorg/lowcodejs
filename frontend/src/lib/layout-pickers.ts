import type { IField } from './interfaces';

export function HeaderFilter(field: IField): boolean {
  return field.configuration.listing && !field.trashed;
}

export function HeaderSorter(order: Array<string>) {
  return function (a: IField, b: IField): number {
    return order.indexOf(a._id) - order.indexOf(b._id);
  };
}
