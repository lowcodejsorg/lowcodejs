type ValidationResult = { message: string } | undefined;

export function requiredString(
  value: string | undefined | null,
  msg = 'Campo obrigatório',
): ValidationResult {
  if (!value || value.trim() === '') {
    return { message: msg };
  }
  return undefined;
}

export function maxLength(
  value: string | undefined | null,
  max: number,
  msg?: string,
): ValidationResult {
  if (value && value.length > max) {
    return { message: msg ?? `Deve ter no máximo ${max} caracteres` };
  }
  return undefined;
}

export function minLength(
  value: string | undefined | null,
  min: number,
  msg?: string,
): ValidationResult {
  if (value && value.length < min) {
    return { message: msg ?? `Deve ter no mínimo ${min} caracteres` };
  }
  return undefined;
}

export function validEmail(
  value: string | undefined | null,
  msg = 'Digite um email válido',
): ValidationResult {
  if (!value) return undefined;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return { message: msg };
  }
  return undefined;
}

export function validUrl(
  value: string | undefined | null,
  msg = 'Digite uma URL válida',
): ValidationResult {
  if (!value) return undefined;
  try {
    new URL(value);
    return undefined;
  } catch {
    return { message: msg };
  }
}

type Validator = (value: string | undefined | null) => ValidationResult;

export function compose(
  ...validators: Array<Validator>
): (value: string | undefined | null) => ValidationResult {
  return (value) => {
    for (const validator of validators) {
      const result = validator(value);
      if (result) return result;
    }
    return undefined;
  };
}
