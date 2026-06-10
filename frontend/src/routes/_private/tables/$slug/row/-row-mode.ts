import type { IRow } from '@/lib/interfaces';

// Sem `mode` explícito na URL, um rascunho do próprio criador abre direto em
// edição para continuar o preenchimento; os demais abrem em visualização.
export function resolveExistingMode(
  explicit: 'view' | 'edit' | undefined,
  row: IRow,
  userId: string | undefined,
): 'view' | 'edit' {
  if (explicit) return explicit;
  if (
    row.status === 'draft' &&
    Boolean(userId) &&
    row.creator?._id === userId
  ) {
    return 'edit';
  }
  return 'view';
}
