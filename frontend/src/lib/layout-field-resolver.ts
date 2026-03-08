import type { IField, ILayoutFields } from '@/lib/interfaces';

/**
 * Resolve a layout field by configured ID, falling back to the first field of the expected type.
 */
export function resolveLayoutField(
  fields: Array<IField>,
  layoutFields: ILayoutFields | null | undefined,
  role: keyof ILayoutFields,
  fallbackType: string,
): IField | undefined {
  const configuredId = layoutFields?.[role];

  if (configuredId) {
    const found = fields.find((f) => f._id === configuredId && !f.trashed);
    if (found) return found;
  }

  return fields.find((f) => f.type === fallbackType && !f.trashed);
}
