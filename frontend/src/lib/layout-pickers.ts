import { E_FIELD_TYPE } from "@/lib/constant";
import { IField } from "./interfaces";

export function sortByOrder<T extends { order?: number; position?: number }>(fields: T[]) {
    return [...fields].sort((a, b) => (a.order ?? a.position ?? 0) - (b.order ?? b.position ?? 0));
}

export function isEmpty(v: any) {
    if (v === null || v === undefined) return true;
    if (typeof v === "string" && v.trim() === "") return true;
    if (Array.isArray(v) && v.length === 0) return true;
    return false;
}

export function getFileUrl(value: any): string | null {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return getFileUrl(value[0]);
    if (typeof value === "object") return value.url || value.downloadUrl || value.path || null;
    return null;
}

export function pickThumbTitleDesc(fieldsOrdered: any[], row: any) {
    const thumb = fieldsOrdered.find((f) => f.type === E_FIELD_TYPE.FILE && !isEmpty(row[f.slug ?? f.id]));
    const title = fieldsOrdered.find((f) => f.type === E_FIELD_TYPE.TEXT_SHORT && !isEmpty(row[f.slug ?? f.id]));
    const desc  = fieldsOrdered.find((f) => f.type === E_FIELD_TYPE.TEXT_LONG && !isEmpty(row[f.slug ?? f.id]));
    
    return { thumb, title, desc };
}

export function HeaderFilter(field: IField): boolean {
    return field.configuration.listing && !field.trashed;
}

export function HeaderSorter(order: Array<string>) {
    return function (a: IField, b: IField): number {
        return order.indexOf(a._id) - order.indexOf(b._id);
    };
}
