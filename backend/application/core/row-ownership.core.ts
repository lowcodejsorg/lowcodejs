/**
 * Resolve o id do criador de uma row, aceitando id em string ou objeto populado
 * `{ _id }`. Usado pelo enforcement "apenas a sua" (perfil contributor) nos
 * use-cases de update/delete/send-to-trash de registros.
 */
export function resolveCreatorId(creator: unknown): string | null {
  if (typeof creator === 'string') return creator;
  if (creator && typeof creator === 'object' && '_id' in creator) {
    const id = creator._id;
    if (typeof id === 'string') return id;
  }
  return null;
}
