import slugify from 'slugify';

export const FIELD_NAME_MAX_LENGTH = 500;
export const FIELD_SLUG_MAX_LENGTH = 80;
export const FIELD_SLUG_MIN_LENGTH = 2;
export const FIELD_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeFieldSlug(value: string): string {
  return slugify(value, {
    lower: true,
    strict: true,
    trim: true,
  })
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, FIELD_SLUG_MAX_LENGTH)
    .replace(/^-|-$/g, '');
}

export function suggestFieldSlug(name: string): string {
  return normalizeFieldSlug(name);
}

export function getFieldSlugError(slug: string): string | null {
  if (slug.length < FIELD_SLUG_MIN_LENGTH) {
    return `O slug deve ter no mínimo ${FIELD_SLUG_MIN_LENGTH} caracteres`;
  }

  if (slug.length > FIELD_SLUG_MAX_LENGTH) {
    return `O slug deve ter no máximo ${FIELD_SLUG_MAX_LENGTH} caracteres`;
  }

  if (!FIELD_SLUG_PATTERN.test(slug)) {
    return 'Use apenas letras minúsculas, números e hífens, sem acentos ou caracteres especiais';
  }

  return null;
}

export function resolveFieldSlug(payload: {
  name: string;
  slug?: string | null;
}): { slug: string; error: string | null } {
  const rawSlug = payload.slug?.trim() || payload.name;
  const slug = normalizeFieldSlug(rawSlug);

  return {
    slug,
    error: getFieldSlugError(slug),
  };
}

export function suggestUniqueFieldSlug(
  name: string,
  existingSlugs: string[],
): string {
  const base = suggestFieldSlug(name) || 'campo';
  const used = new Set(existingSlugs);

  if (!used.has(base)) return base;

  for (let index = 2; index < 1000; index++) {
    const suffix = `-${index}`;
    const candidate = `${base.slice(0, FIELD_SLUG_MAX_LENGTH - suffix.length).replace(/-$/g, '')}${suffix}`;

    if (!used.has(candidate)) return candidate;
  }

  return `${base.slice(0, FIELD_SLUG_MAX_LENGTH - 5).replace(/-$/g, '')}-${Date.now().toString().slice(-4)}`;
}
