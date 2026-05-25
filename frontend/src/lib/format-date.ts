import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-';
  try {
    return format(new Date(value), "dd 'de' MMM 'de' yyyy 'às' HH:mm:ss", {
      locale: ptBR,
    });
  } catch {
    return '-';
  }
}
