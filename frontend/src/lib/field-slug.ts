export const FIELD_NAME_MAX_LENGTH = 500;
export const FIELD_SLUG_MAX_LENGTH = 80;
export const FIELD_SLUG_MIN_LENGTH = 2;
export const FIELD_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeFieldSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, FIELD_SLUG_MAX_LENGTH)
    .replace(/^-|-$/g, '');
}

export function getFieldSlugError(slug: string): string | undefined {
  if (slug.length < FIELD_SLUG_MIN_LENGTH) {
    return `O slug deve ter no mínimo ${FIELD_SLUG_MIN_LENGTH} caracteres`;
  }

  if (slug.length > FIELD_SLUG_MAX_LENGTH) {
    return `O slug deve ter no máximo ${FIELD_SLUG_MAX_LENGTH} caracteres`;
  }

  if (!FIELD_SLUG_PATTERN.test(slug)) {
    return 'Use apenas letras minúsculas, números e hífens';
  }

  return undefined;
}
