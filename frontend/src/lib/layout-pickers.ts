import type { IField } from './interfaces';

export function HeaderFilter(field: IField): boolean {
  return field.visibilityList !== 'HIDDEN' && !field.trashed;
}

export function HeaderSorter(order: Array<string>) {
  return function (a: IField, b: IField): number {
    const idxA = order.indexOf(a._id);
    const idxB = order.indexOf(b._id);
    return (idxA === -1 ? Infinity : idxA) - (idxB === -1 ? Infinity : idxB);
  };
}
