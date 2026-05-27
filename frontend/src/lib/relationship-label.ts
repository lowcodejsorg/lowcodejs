import type { IFieldConfigurationRelationship, IRow } from './interfaces';

const DEFAULT_SEPARATOR = ' - ';

/**
 * Resolve um caminho separado por pontos (ex: "nome", "categoria.nome",
 * "fornecedor.cidade.uf") contra uma linha (registro) relacionada já populada.
 *
 * Relacionamentos são armazenados como arrays de objetos populados; a cada
 * salto de relacionamento, pegamos o primeiro elemento do array. Para arrays
 * de escalares (ex: dropdown múltiplo) juntamos os valores por vírgula.
 */
export function resolveRelationshipValue(
  source: unknown,
  path: string,
): string {
  if (!path) return '';

  let current: unknown = source;

  for (const key of path.split('.')) {
    if (Array.isArray(current)) current = current[0];
    if (current === null || current === undefined) return '';
    if (typeof current !== 'object') return '';
    current = (current as Record<string, unknown>)[key];
  }

  if (Array.isArray(current)) {
    const scalars = current.filter(
      (item) => item !== null && item !== undefined && typeof item !== 'object',
    );
    if (scalars.length > 0) return scalars.map(String).join(', ');
    current = current[0];
  }

  if (current === null || current === undefined) return '';
  if (typeof current === 'object') return '';

  return String(current);
}

/**
 * Computa o label de exibição de uma opção de relacionamento.
 *
 * - Se `customLabel` estiver ativo e houver `labelParts`, compõe o label
 *   resolvendo cada caminho e juntando com `labelSeparator`.
 * - Caso contrário, usa o comportamento legado: `row[relConfig.field.slug]`.
 * - Fallback final: `row._id`.
 */
export function resolveRelationshipLabel(
  row: IRow,
  relConfig: IFieldConfigurationRelationship | null | undefined,
): string {
  const fallback = String(row?._id ?? '');
  if (!relConfig) return fallback;

  if (
    relConfig.customLabel &&
    relConfig.labelParts &&
    relConfig.labelParts.length > 0
  ) {
    const separator = relConfig.labelSeparator ?? DEFAULT_SEPARATOR;
    const parts = relConfig.labelParts
      .map((part) => resolveRelationshipValue(row, part.path))
      .filter((value) => value !== '');
    if (parts.length > 0) return parts.join(separator);
  }

  const single = relConfig.field?.slug
    ? resolveRelationshipValue(row, relConfig.field.slug)
    : '';

  return single !== '' ? single : fallback;
}
