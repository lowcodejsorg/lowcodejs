import type { ComponentType } from 'react';

export type ExtensionEntryType = 'plugins' | 'modules' | 'tools';

type ExtensionEntryModule = {
  default: ComponentType<Record<string, unknown>>;
};

/**
 * Mapa estático de todas as entries de extensão (plugins/modules/tools) feito
 * em build-time pelo Vite via `import.meta.glob`. Cada valor é uma factory
 * que retorna uma Promise do módulo (lazy load real).
 */
const entries = import.meta.glob<ExtensionEntryModule>(
  '../../extensions/*/{plugins,modules,tools}/*/index.tsx',
);

function buildKey(pkg: string, type: ExtensionEntryType, id: string): string {
  return `../../extensions/${pkg}/${type}/${id}/index.tsx`;
}

/**
 * Carrega o componente default de uma extensão. Retorna `null` quando a entry
 * correspondente não existe no bundle (extensão sem código frontend ou path
 * incorreto).
 */
export async function loadExtensionEntry(
  pkg: string,
  type: ExtensionEntryType,
  id: string,
): Promise<ComponentType<Record<string, unknown>> | null> {
  const loader = entries[buildKey(pkg, type, id)];
  if (!loader) return null;
  const mod = await loader();
  return mod.default;
}

export function hasExtensionEntry(
  pkg: string,
  type: ExtensionEntryType,
  id: string,
): boolean {
  return buildKey(pkg, type, id) in entries;
}
