import { useFieldContext } from './form-context';

import { getFieldInvalidState } from '@/lib/form-utils';

/**
 * Hook para verificar se um campo está inválido.
 * Considera erros de validação local (touched && !isValid) e erros de API
 * gravados no slot `onServer` do errorMap (sempre visíveis).
 */
export function useFieldValidation<T = unknown>(): {
  field: ReturnType<typeof useFieldContext<T>>;
  isInvalid: boolean;
  errors: Array<string>;
} {
  const field = useFieldContext<T>();
  const isInvalid = getFieldInvalidState(field.state.meta);

  return {
    field,
    isInvalid,
    errors: field.state.meta.errors,
  };
}
