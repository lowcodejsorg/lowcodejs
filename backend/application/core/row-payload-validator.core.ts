import {
  E_FIELD_FORMAT,
  E_FIELD_TYPE,
  type IField,
  type IGroupConfiguration,
} from './entity.core';

// type FieldType = (typeof E_FIELD_TYPE)[keyof typeof E_FIELD_TYPE];
type FieldFormat = (typeof E_FIELD_FORMAT)[keyof typeof E_FIELD_FORMAT];

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const FORMAT_VALIDATORS: Record<string, { regex: RegExp; message: string }> = {
  [E_FIELD_FORMAT.EMAIL]: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Formato de e-mail inválido',
  },
  [E_FIELD_FORMAT.URL]: {
    regex: /^https?:\/\/.+/,
    message: 'Formato de URL inválido',
  },
  [E_FIELD_FORMAT.INTEGER]: {
    regex: /^-?\d+$/,
    message: 'Deve ser um número inteiro',
  },
  [E_FIELD_FORMAT.DECIMAL]: {
    regex: /^-?\d+(\.\d+)?$/,
    message: 'Deve ser um número decimal',
  },
  [E_FIELD_FORMAT.ALPHA_NUMERIC]: {
    regex: /^[a-zA-Z0-9\s]*$/,
    message: 'Deve ser alfanumérico',
  },
};

function isValidObjectId(value: unknown): boolean {
  return typeof value === 'string' && OBJECT_ID_REGEX.test(value);
}

function isValidISODate(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

function validateFormat(
  value: string,
  format: FieldFormat | null,
): string | null {
  if (!format || !FORMAT_VALIDATORS[format]) return null;

  const validator = FORMAT_VALIDATORS[format];
  if (!validator.regex.test(value)) {
    return validator.message;
  }
  return null;
}

function validateFieldValue(
  value: unknown,
  field: IField,
  groups?: IGroupConfiguration[],
): string | null {
  const { type, configuration } = field;
  const isRequired = configuration?.required ?? false;

  // Check required
  if (value === null || value === undefined || value === '') {
    if (isRequired) {
      return 'Este campo é obrigatório';
    }
    return null;
  }

  switch (type) {
    case E_FIELD_TYPE.TEXT_SHORT: {
      if (typeof value !== 'string') {
        return 'Deve ser um texto';
      }
      const formatError = validateFormat(value, configuration?.format ?? null);
      if (formatError) return formatError;
      return null;
    }

    case E_FIELD_TYPE.TEXT_LONG: {
      if (typeof value !== 'string') {
        return 'Deve ser um texto';
      }
      return null;
    }

    case E_FIELD_TYPE.DATE: {
      if (!isValidISODate(value)) {
        return 'Deve ser uma data válida no formato ISO 8601';
      }
      return null;
    }

    case E_FIELD_TYPE.DROPDOWN: {
      if (!Array.isArray(value)) {
        return 'Deve ser uma lista';
      }
      for (const item of value) {
        if (typeof item !== 'string') {
          return 'Todos os itens devem ser textos';
        }
      }
      return null;
    }

    case E_FIELD_TYPE.FILE:
    case E_FIELD_TYPE.RELATIONSHIP:
    case E_FIELD_TYPE.USER: {
      if (!Array.isArray(value)) {
        return 'Deve ser uma lista';
      }
      for (const item of value) {
        if (!isValidObjectId(item)) {
          return 'Todos os itens devem ser IDs válidos';
        }
      }
      return null;
    }

    case E_FIELD_TYPE.CATEGORY: {
      if (!Array.isArray(value)) {
        return 'Deve ser uma lista';
      }
      for (const item of value) {
        if (typeof item !== 'string') {
          return 'Todos os itens devem ser textos';
        }
      }
      return null;
    }

    case E_FIELD_TYPE.FIELD_GROUP: {
      if (!Array.isArray(value)) {
        return 'Deve ser uma lista de objetos';
      }

      // Find the group configuration
      const groupConfig = groups?.find(
        (g) => g.slug === configuration?.group?.slug,
      );
      if (!groupConfig) {
        return null; // No group config, skip validation
      }

      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (typeof item !== 'object' || item === null) {
          return `Item no índice ${i} deve ser um objeto`;
        }

        // Validate each field in the group
        for (const groupField of groupConfig.fields) {
          const fieldValue = (item as Record<string, unknown>)[groupField.slug];
          const fieldError = validateFieldValue(fieldValue, groupField);
          if (fieldError) {
            return `Item ${i}: ${groupField.name} - ${fieldError}`;
          }
        }
      }
      return null;
    }

    case E_FIELD_TYPE.REACTION:
    case E_FIELD_TYPE.EVALUATION:
      // These are system-managed fields, skip validation
      return null;

    default:
      return null;
  }
}

export function validateRowPayload(
  payload: Record<string, unknown>,
  fields: IField[],
  groups?: IGroupConfiguration[],
): Record<string, string> | null {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    // Skip system-managed fields
    if (
      field.type === E_FIELD_TYPE.REACTION ||
      field.type === E_FIELD_TYPE.EVALUATION
    ) {
      continue;
    }

    const value = payload[field.slug];
    const error = validateFieldValue(value, field, groups);

    if (error) {
      errors[field.slug] = error;
    }
  }

  console.log('errors', errors);

  return Object.keys(errors).length > 0 ? errors : null;
}
