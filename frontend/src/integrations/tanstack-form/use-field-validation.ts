import { useFieldContext } from './form-context';

/**
 * Hook para verificar se um campo está inválido.
 * Retorna true se o campo foi tocado E não é válido.
 */
export function useFieldValidation<T = unknown>(): {
  field: ReturnType<typeof useFieldContext<T>>;
  isInvalid: boolean;
  errors: Array<string>;
} {
  const field = useFieldContext<T>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return {
    field,
    isInvalid,
    errors: field.state.meta.errors,
  };
}
