import { AxiosError } from 'axios';

import type { IHTTPExeptionError } from '@/lib/interfaces';
import { toastError } from '@/lib/toast';

interface HandleApiErrorOptions {
  context: string;
  onFieldErrors?: (errors: Record<string, string>) => void;
  causeHandlers?: Record<
    string,
    (errorData: IHTTPExeptionError<Record<string, string>>) => void
  >;
}

export function handleApiError(
  error: unknown,
  options: HandleApiErrorOptions,
): void {
  if (!(error instanceof AxiosError) || !error.response?.data) {
    toastError(options.context, 'Erro inesperado');
    return;
  }

  const errorData = error.response.data as IHTTPExeptionError<
    Record<string, string>
  >;
  const cause = errorData.cause;

  if (
    cause === 'INVALID_PAYLOAD_FORMAT' &&
    errorData.errors &&
    options.onFieldErrors
  ) {
    options.onFieldErrors(errorData.errors);
    return;
  }

  if (options.causeHandlers?.[cause]) {
    options.causeHandlers[cause](errorData);
    return;
  }

  const titleMap: Record<string, string> = {
    TABLE_PRIVATE: 'Tabela privada',
    ACCESS_DENIED: 'Acesso negado',
    OWNER_OR_ADMIN_REQUIRED: 'Acesso negado',
    RESTRICTED_CREATE: 'Criacao restrita',
  };

  const title = titleMap[cause] ?? options.context;
  toastError(title, errorData.message ?? options.context);
}
