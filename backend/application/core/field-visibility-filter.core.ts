import type { IField, IRow } from '@application/core/entity.core';

export type FieldVisibilityContext = 'list' | 'form' | 'detail';

const CONTEXT_TO_FIELD: Record<FieldVisibilityContext, keyof IField> = {
  list: 'visibilityList',
  form: 'visibilityForm',
  detail: 'visibilityDetail',
};

/**
 * Remove chaves do row cujo field tem visibilidade HIDDEN no contexto
 * informado ou exige um grupo que o usuario nao possui (apos resolucao
 * recursiva de encompasses).
 *
 * effectiveGroupIds deve ser o conjunto de group ids resolvidos do usuario
 * (diretos + encompasses). Visitante: passe conjunto vazio — somente campos
 * com visibilidade PUBLIC permanecem.
 */
export function filterRowFieldsByVisibility(
  row: IRow,
  fields: IField[],
  effectiveGroupIds: Set<string>,
  context: FieldVisibilityContext,
): IRow {
  const visibilityKey = CONTEXT_TO_FIELD[context];
  const result: IRow = { ...row };

  for (const field of fields) {
    if (field.native === true) continue;
    const rawValue = field[visibilityKey];
    if (typeof rawValue !== 'string') continue;

    if (rawValue === 'HIDDEN') {
      delete result[field.slug];
      continue;
    }

    if (rawValue === 'PUBLIC') continue;

    if (!effectiveGroupIds.has(rawValue)) {
      delete result[field.slug];
    }
  }

  return result;
}
