import type { AnyFormApi } from '@tanstack/form-core';
import { useStore } from '@tanstack/react-form';
import { useEffect, useRef } from 'react';

import { clearApiFieldErrors } from '@/lib/form-utils';

/**
 * Observa `state.values` do form e limpa todos os erros do slot `onServer`
 * do errorMap quando o usuário altera qualquer campo. Segue o padrão reativo
 * do TanStack Form usado em `tables/` (useStore + selector).
 */
export function useApiErrorAutoClear(form: AnyFormApi): void {
  const values = useStore(form.store, (state) => state.values);
  const previousValues = useRef(values);

  useEffect(() => {
    if (previousValues.current === values) return;
    previousValues.current = values;
    clearApiFieldErrors(form);
  }, [form, values]);
}
