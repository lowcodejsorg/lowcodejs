import type {
  IEmbeddedSchema,
  IField,
  IGroupConfiguration,
  ITableSchema,
  ValueOf,
} from '../entity.core';
import { E_FIELD_TYPE, E_SCHEMA_TYPE } from '../entity.core';

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/;

export const FieldTypeMapper: Record<
  keyof typeof E_FIELD_TYPE,
  ValueOf<typeof E_SCHEMA_TYPE>
> = {
  [E_FIELD_TYPE.TEXT_SHORT]: E_SCHEMA_TYPE.STRING,
  [E_FIELD_TYPE.TEXT_LONG]: E_SCHEMA_TYPE.STRING,
  [E_FIELD_TYPE.DROPDOWN]: E_SCHEMA_TYPE.STRING,
  [E_FIELD_TYPE.FILE]: E_SCHEMA_TYPE.OBJECT_ID,
  [E_FIELD_TYPE.DATE]: E_SCHEMA_TYPE.DATE,
  [E_FIELD_TYPE.RELATIONSHIP]: E_SCHEMA_TYPE.OBJECT_ID,
  [E_FIELD_TYPE.FIELD_GROUP]: E_SCHEMA_TYPE.OBJECT_ID,
  [E_FIELD_TYPE.EVALUATION]: E_SCHEMA_TYPE.OBJECT_ID,
  [E_FIELD_TYPE.REACTION]: E_SCHEMA_TYPE.OBJECT_ID,
  [E_FIELD_TYPE.CATEGORY]: E_SCHEMA_TYPE.STRING,
  [E_FIELD_TYPE.USER]: E_SCHEMA_TYPE.OBJECT_ID,

  // NATIVE
  [E_FIELD_TYPE.IDENTIFIER]: E_SCHEMA_TYPE.OBJECT_ID,
  [E_FIELD_TYPE.CREATOR]: E_SCHEMA_TYPE.OBJECT_ID,
  [E_FIELD_TYPE.CREATED_AT]: E_SCHEMA_TYPE.DATE,
  [E_FIELD_TYPE.TRASHED]: E_SCHEMA_TYPE.BOOLEAN,
  [E_FIELD_TYPE.TRASHED_AT]: E_SCHEMA_TYPE.DATE,
};

function mapperSchema(
  field: IField,
  groups?: IGroupConfiguration[],
): ITableSchema {
  const mapper = {
    [E_FIELD_TYPE.TEXT_SHORT]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'String',
        required: Boolean(field.required || false),
      },
    },

    [E_FIELD_TYPE.TEXT_LONG]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'String',
        required: Boolean(field.required || false),
      },
    },

    [E_FIELD_TYPE.DROPDOWN]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.required || false),
        },
      ],
    },

    [E_FIELD_TYPE.FILE]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.required || false),
          ref: 'Storage',
        },
      ],
    },

    [E_FIELD_TYPE.RELATIONSHIP]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.required || false),
          ref: field?.relationship?.table?.slug ?? undefined,
        },
      ],
    },

    [E_FIELD_TYPE.FIELD_GROUP]: ((): Record<string, IEmbeddedSchema[]> => {
      const groupSlug = field?.group?.slug;
      const group = groups?.find((g) => g.slug === groupSlug);
      return {
        [field.slug]: [
          {
            type: 'Embedded' as const,
            schema: group?._schema || {},
            required: Boolean(field.required || false),
          },
        ],
      };
    })(),

    [E_FIELD_TYPE.DATE]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'Date',
        required: Boolean(field.required || false),
      },
    },

    [E_FIELD_TYPE.CATEGORY]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.required || false),
        },
      ],
    },

    [E_FIELD_TYPE.EVALUATION]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'Number',
          required: false,
          ref: 'Evaluation',
        },
      ],
    },

    [E_FIELD_TYPE.REACTION]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: false,
          ref: 'Reaction',
        },
      ],
    },

    [E_FIELD_TYPE.USER]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.required || false),
          ref: 'User',
        },
      ],
    },

    // NATIVE
    [E_FIELD_TYPE.IDENTIFIER]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'String',
        required: Boolean(field.required || false),
      },
    },

    [E_FIELD_TYPE.CREATOR]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'String',
        required: Boolean(field.required || false),
        ref: 'User',
      },
    },

    [E_FIELD_TYPE.CREATED_AT]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'Date',
        required: Boolean(field.required || false),
      },
    },

    [E_FIELD_TYPE.TRASHED]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'Boolean',
        required: Boolean(field.required || false),
        default: false,
      },
    },

    [E_FIELD_TYPE.TRASHED_AT]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'Date',
        required: Boolean(field.required || false),
        default: null,
      },
    },
  };

  if (!(field.type in mapper) && !field?.multiple) {
    return {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'String',
        required: Boolean(field.required || false),
      },
    };
  }

  if (!(field.type in mapper) && field?.multiple) {
    return {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.required || false),
        },
      ],
    };
  }

  return mapper[field.type as keyof typeof mapper];
}

export function buildSchema(
  fields: IField[],
  groups?: IGroupConfiguration[],
): ITableSchema {
  const schema: ITableSchema = {};

  for (const field of fields) {
    if (
      field.type === E_FIELD_TYPE.IDENTIFIER ||
      field.type === E_FIELD_TYPE.CREATED_AT
    ) {
      continue;
    }
    Object.assign(schema, mapperSchema(field, groups));
  }

  return schema;
}
