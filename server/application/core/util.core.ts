import type { RootFilterQuery, SortOrder } from 'mongoose';
import mongoose from 'mongoose';

import { Table } from '@application/model/table.model';
import EmailService from '@application/services/email.service';

import type { Field, Optional, Row, Schema, TableSchema } from './entity.core';
import { FIELD_TYPE } from './entity.core';

const FieldTypeMapper: Record<FIELD_TYPE, Schema['type']> = {
  [FIELD_TYPE.TEXT_SHORT]: 'String',
  [FIELD_TYPE.TEXT_LONG]: 'String',
  [FIELD_TYPE.DROPDOWN]: 'String',
  [FIELD_TYPE.FILE]: 'ObjectId',
  [FIELD_TYPE.DATE]: 'Date',
  [FIELD_TYPE.RELATIONSHIP]: 'ObjectId',
  [FIELD_TYPE.FIELD_GROUP]: 'ObjectId',
  [FIELD_TYPE.EVALUATION]: 'ObjectId',
  [FIELD_TYPE.REACTION]: 'ObjectId',
  [FIELD_TYPE.CATEGORY]: 'String',
};

function mapperSchema(field: Field): TableSchema {
  const mapper = {
    [FIELD_TYPE.TEXT_SHORT]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'String',
        required: Boolean(field.configuration?.required || false),
      },
    },

    [FIELD_TYPE.TEXT_LONG]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'String',
        required: Boolean(field.configuration?.required || false),
      },
    },

    [FIELD_TYPE.DROPDOWN]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.configuration?.required || false),
        },
      ],
    },

    [FIELD_TYPE.FILE]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.configuration?.required || false),
          ref: 'Storage',
        },
      ],
    },

    [FIELD_TYPE.RELATIONSHIP]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.configuration?.required || false),
          ref: field?.configuration?.relationship?.table?.slug ?? undefined,
        },
      ],
    },

    [FIELD_TYPE.FIELD_GROUP]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.configuration?.required || false),
          ref: field?.configuration?.group?.slug ?? undefined,
        },
      ],
    },

    [FIELD_TYPE.CATEGORY]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.configuration?.required || false),
        },
      ],
    },

    [FIELD_TYPE.EVALUATION]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'Number',
          required: false,
          ref: 'Evaluation',
        },
      ],
    },

    [FIELD_TYPE.REACTION]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: false,
          ref: 'Reaction',
        },
      ],
    },
  };

  if (!(field.type in mapper) && !field?.configuration?.multiple) {
    return {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'String',
        required: Boolean(field.configuration?.required || false),
      },
    };
  }

  if (!(field.type in mapper) && field?.configuration?.multiple) {
    return {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.configuration?.required || false),
        },
      ],
    };
  }

  return mapper[field.type as keyof typeof mapper];
}

export function buildSchema(fields: Field[]): TableSchema {
  const schema: TableSchema = {
    trashedAt: {
      type: 'Date',
      default: null,
    },
    trashed: {
      type: 'Boolean',
      default: false,
    },
  };

  for (const field of fields) {
    Object.assign(schema, mapperSchema(field));
  }

  return schema;
}

interface Entity extends Omit<Row, '_id'>, mongoose.Document<Omit<Row, '_id'>> {
  _id: mongoose.Types.ObjectId;
}

export async function buildTable(
  table: Optional<
    import('@application/core/entity.core').Table,
    '_id' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt'
  >,
): Promise<mongoose.Model<Entity>> {
  if (!table?.slug) throw new Error('Table slug not found');

  if (!table?._schema) throw new Error('Table schema not found');

  if (mongoose.models[table.slug]) delete mongoose.models[table.slug];

  const schema = new mongoose.Schema(
    {
      ...table?._schema,
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    },
  );

  // ===== ADICIONA OS MIDDLEWARES AQUI =====

  if (table?.methods?.beforeSave?.code) {
    schema.pre('save', async function (next) {
      console.log('BEFORE SAVE');
      const result = HandlerFunction(
        table?.methods?.beforeSave?.code!,
        this,
        table.slug.toLowerCase(),
        table.fields.map((f: any) => f.slug),
        {
          ...(this.isNew && { userAction: 'novo_registro' }),
          ...(!this.isNew && { userAction: 'editar_registro' }),
          executionMoment: 'antes_salvar',
          tableId: table._id?.toString(),
          userId: this.creator?.toString(),
        },
      );

      if (!result.success) {
        throw new Error(`Erro no beforeSave: ${result.error}`);
      }

      next();
    });
  }

  if (table?.methods?.afterSave?.code) {
    schema.post('save', async function (doc, next) {
      console.log('AFTER SAVE');

      const result = HandlerFunction(
        table?.methods?.afterSave?.code!,
        doc,
        table.slug.toLowerCase(),
        table.fields.map((f: any) => f.slug),
        {
          ...(doc.isNew && { userAction: 'novo_registro' }),
          ...(!doc.isNew && { userAction: 'editar_registro' }),
          executionMoment: 'depois_salvar',
          tableId: table._id?.toString(),
          userId: doc.creator?.toString(),
        },
      );

      if (!result.success) {
        console.error('Erro no afterSave (não bloqueante):', result.error);
      }

      next();
    });
  }

  if (table?.methods?.onLoad?.code) {
    // Para consultas individuais (findOne)
    schema.post('findOne', async function (doc, next) {
      if (doc) {
        console.log('ON LOAD - findOne');
        const result = HandlerFunction(
          table?.methods?.onLoad?.code!,
          doc,
          table.slug.toLowerCase(),
          table.fields.map((f: any) => f.slug),
          {
            userAction: 'carregamento_formulario',
            executionMoment: 'carregamento_formulario',
            tableId: table._id?.toString(),
            userId: doc.creator?.toString(),
          },
        );

        if (!result.success) {
          console.error('Erro no onLoad (não bloqueante):', result.error);
        }
      }
      next();
    });

    // Para consultas múltiplas (find)
    schema.post('find', async function (docs, next) {
      if (docs && Array.isArray(docs)) {
        console.log('ON LOAD - find');
        for (const doc of docs) {
          const result = HandlerFunction(
            table?.methods?.onLoad?.code!,
            doc,
            table.slug.toLowerCase(),
            table.fields.map((f: any) => f.slug),
            {
              userAction: 'carregamento_formulario',
              executionMoment: 'carregamento_formulario',
              tableId: table._id?.toString(),
              userId: doc.creator?.toString(),
            },
          );

          if (!result.success) {
            console.error('Erro no onLoad (não bloqueante):', result.error);
          }
        }
      }
      next();
    });
  }

  // ===== FIM DOS MIDDLEWARES =====

  const model = (mongoose.models[table?.slug] ||
    mongoose.model<Entity>(
      table?.slug,
      schema,
      table?.slug,
    )) as mongoose.Model<Entity>;

  await model?.createCollection();

  return model;
}

export function getRelationship(fields: Field[] = []): Field[] {
  const types = [
    FIELD_TYPE.RELATIONSHIP,
    FIELD_TYPE.FILE,
    FIELD_TYPE.FIELD_GROUP,
    FIELD_TYPE.REACTION,
    FIELD_TYPE.EVALUATION,
  ];

  return fields?.filter((field) => field.type && types.includes(field.type));
}

export async function buildPopulate(
  fields?: Field[],
): Promise<{ path: string; model?: string; select?: string }[]> {
  const relacionamentos = getRelationship(fields);
  const populate = [];

  for await (const field of relacionamentos) {
    if (
      ![
        FIELD_TYPE.FIELD_GROUP,
        FIELD_TYPE.REACTION,
        FIELD_TYPE.EVALUATION,
        FIELD_TYPE.RELATIONSHIP,
      ].includes(field.type)
    ) {
      populate.push({
        path: field.slug,
      });
    }

    if (field.type === FIELD_TYPE.REACTION) {
      populate.push({
        path: field.slug,
        populate: {
          path: 'user',
          select: 'name email _id',
        },
      });
    }

    if (field.type === FIELD_TYPE.EVALUATION) {
      populate.push({
        path: field.slug,
        populate: {
          path: 'user',
          select: 'name email _id',
        },
      });
    }

    if (field.type === FIELD_TYPE.RELATIONSHIP) {
      const relationshipTableId =
        field?.configuration?.relationship?.table?._id?.toString();
      const relationshipTable = await Table.findOne({
        _id: relationshipTableId,
      });

      if (relationshipTable) {
        await buildTable({
          ...relationshipTable.toJSON({
            flattenObjectIds: true,
          }),
          _id: relationshipTable._id.toString(),
        });

        const relationshipFields = getRelationship(
          relationshipTable?.fields as Field[],
        );
        const relationshipPopulate = await buildPopulate(relationshipFields);

        populate.push({
          path: field.slug,
          ...(relationshipPopulate.length > 0 && {
            populate: relationshipPopulate,
          }),
        });
      }
    }

    if (field.type === FIELD_TYPE.FIELD_GROUP) {
      const groupId = field?.configuration?.group?._id?.toString();

      const group = await Table.findOne({
        _id: groupId,
      }).populate([
        {
          path: 'fields',
          model: 'Field',
        },
      ]);

      if (group) {
        await buildTable({
          ...group.toJSON({
            flattenObjectIds: true,
          }),
          _id: group._id.toString(),
        });

        const groupRelationship = getRelationship(group?.fields as Field[]);

        const groupFields = await buildPopulate(groupRelationship);

        populate.push({
          path: field.slug,
          ...(groupFields.length > 0 && {
            populate: groupFields,
          }),
        });
      }
    }
  }

  return [
    ...populate,
    {
      path: 'creator',
      model: 'User',
      select: 'name email _id',
    },
  ];
}

type Query = Record<string, any>;

export async function buildQuery(
  { search, trashed, ...payload }: Partial<Query>,
  fields: Field[] = [],
): Promise<Query> {
  let query: Query = {
    ...(trashed && { trashed: trashed === 'true' }),
  };

  for (const field of fields.filter((f) => f.type !== FIELD_TYPE.FIELD_GROUP)) {
    const slug = String(field.slug?.toString());

    if (
      [FIELD_TYPE.TEXT_SHORT, FIELD_TYPE.TEXT_LONG].includes(field.type) &&
      payload[slug]
    ) {
      query[slug] = {
        $regex: normalize(payload[slug]?.toString()),
        $options: 'i',
      };
    }

    if (
      [
        FIELD_TYPE.RELATIONSHIP,
        FIELD_TYPE.DROPDOWN,
        FIELD_TYPE.CATEGORY,
      ].includes(field.type) &&
      payload[slug]
    ) {
      query[slug] = {
        $in: payload[slug]?.toString().split(','),
      };
    }

    if (field.type === FIELD_TYPE.DATE) {
      const initialKey = `${slug}-initial`;
      const finalKey = `${slug}-final`;

      if (payload[initialKey]) {
        const initial = new Date(String(payload[initialKey]));
        query[field.slug].$gte = new Date(initial.setUTCHours(0, 0, 0, 0));
      }

      if (payload[finalKey]) {
        const final = new Date(String(payload[finalKey]));
        query[field.slug].$lte = new Date(final.setUTCHours(23, 59, 59, 999));
      }
    }
  }

  const hasFieldGroupQuery = fields.some((f) => {
    if (f.type !== FIELD_TYPE.FIELD_GROUP) return false;
    const groupPrefix = f.slug.concat('-');
    return Object.keys(payload).some((key) => key.startsWith(groupPrefix));
  });

  if (hasFieldGroupQuery) {
    for (const field of fields.filter(
      (f) => f.type === FIELD_TYPE.FIELD_GROUP,
    )) {
      const slug = String(field.slug?.toString());

      const group = await Table.findOne({
        slug: field?.configuration?.group?.slug,
      }).populate([
        {
          path: 'fields',
          model: 'Field',
        },
      ]);

      if (!group) continue;

      let groupPayload: Query = {};

      for (const fieldGroup of group?.fields as import('@application/core/entity.core').Field[]) {
        const fieldGroupSlug = slug.concat('-').concat(String(fieldGroup.slug));
        if (!(fieldGroupSlug in payload)) continue;
        groupPayload[fieldGroup.slug] = payload[fieldGroupSlug];
      }

      const queryGroup = await buildQuery(
        { ...groupPayload },
        group?.fields as import('@application/core/entity.core').Field[],
      );

      if (Object.keys(queryGroup).length > 0 && group) {
        const c = await buildTable({
          ...group?.toJSON({
            flattenObjectIds: true,
          }),
          _id: group?._id.toString(),
        });

        const ids: string[] = await c?.find(queryGroup).distinct('_id');

        if (ids.length === 0) continue;

        query[slug] = {
          $in: ids,
        };
      }
    }
  }

  if (search) {
    const searchQuery: Query[] = [];

    for (const field of fields.filter(
      (f) => f.type !== FIELD_TYPE.FIELD_GROUP,
    )) {
      if ([FIELD_TYPE.TEXT_SHORT, FIELD_TYPE.TEXT_LONG].includes(field?.type)) {
        const slug = String(field.slug?.toString());
        searchQuery.push({
          [slug]: {
            $regex: normalize(search),
            $options: 'i',
          },
        });
      }
    }

    if (searchQuery.length > 0) {
      query = {
        $and: [{ ...query }, { $or: searchQuery }],
      };
    }
  }

  return query;
}

export type QueryOrder = Record<
  string,
  | number
  | string
  | boolean
  | null
  | unknown
  | RootFilterQuery<Row>
  | QueryOrder[]
>;

export function buildOrder(
  query: Partial<QueryOrder>,
  fields: Field[] = [],
): {
  [key: string]: SortOrder;
} {
  if (Object.keys(query).length === 0) return {};

  const order = fields?.reduce(
    (acc, col) => {
      if (!col?.type || !col.slug || !('order-'.concat(col.slug) in query))
        return acc;

      const slug = String(col.slug?.toString());

      acc[slug] = query['order-'.concat(slug)]?.toString() as SortOrder;

      return acc;
    },
    {} as {
      [key: string]: SortOrder;
    },
  );

  return order;
}

export function normalize(search: string): string {
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escapedSearch
    .replace(/a/gi, '[aáàâãä]')
    .replace(/e/gi, '[eéèêë]')
    .replace(/i/gi, '[iíìîï]')
    .replace(/o/gi, '[oóòôõö]')
    .replace(/u/gi, '[uúùûü]')
    .replace(/c/gi, '[cç]')
    .replace(/n/gi, '[nñ]');
}

// Função para normalização avançada de código JavaScript
function normalizeJavaScriptCode(code: string): string {
  let normalized = code;

  // 1. Preservar template literals (evitar quebrar `${variavel}`)
  const templateLiterals: string[] = [];
  let templateIndex = 0;

  // Identificar e substituir template literals por placeholders temporários
  normalized = normalized.replace(/`[^`]*`/g, (match) => {
    const placeholder = `__TEMPLATE_LITERAL_${templateIndex++}__`;
    templateLiterals.push(match);
    return placeholder;
  });

  // 2. Preservar strings com aspas duplas e simples
  const stringLiterals: string[] = [];
  let stringIndex = 0;

  // Strings com aspas duplas
  normalized = normalized.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
    const placeholder = `__STRING_LITERAL_${stringIndex++}__`;
    stringLiterals.push(match);
    return placeholder;
  });

  // Strings com aspas simples
  normalized = normalized.replace(/'(?:[^'\\]|\\.)*'/g, (match) => {
    const placeholder = `__STRING_LITERAL_${stringIndex++}__`;
    stringLiterals.push(match);
    return placeholder;
  });

  // 3. Preservar expressões regulares
  const regexLiterals: string[] = [];
  let regexIndex = 0;

  normalized = normalized.replace(
    /\/(?:[^/\\\n]|\\.)+\/[gimsuvy]*/g,
    (match) => {
      const placeholder = `__REGEX_LITERAL_${regexIndex++}__`;
      regexLiterals.push(match);
      return placeholder;
    },
  );

  // 4. Preservar comentários
  const comments: string[] = [];
  let commentIndex = 0;

  // Comentários de linha
  normalized = normalized.replace(/\/\/.*$/gm, (match) => {
    const placeholder = `__COMMENT_${commentIndex++}__`;
    comments.push(match);
    return placeholder;
  });

  // Comentários de bloco
  normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    const placeholder = `__COMMENT_${commentIndex++}__`;
    comments.push(match);
    return placeholder;
  });

  // 5. Normalizar pontuação e formatação
  normalized = normalized
    .split('\n')
    .map((line) => {
      const trimmedLine = line.trim();

      // Ignora linhas vazias ou só com placeholders de comentários
      if (!trimmedLine || trimmedLine.match(/^__COMMENT_\d+__$/)) {
        return line;
      }

      // Linhas que não precisam de ponto e vírgula
      if (
        trimmedLine.endsWith(';') ||
        trimmedLine.endsWith('{') ||
        trimmedLine.endsWith('}') ||
        trimmedLine.startsWith('if ') ||
        trimmedLine.startsWith('else') ||
        trimmedLine.startsWith('for ') ||
        trimmedLine.startsWith('while ') ||
        trimmedLine.startsWith('switch ') ||
        trimmedLine.startsWith('function ') ||
        trimmedLine.startsWith('async function ') ||
        (trimmedLine.startsWith('const ') && trimmedLine.includes('=>')) ||
        (trimmedLine.startsWith('let ') && trimmedLine.includes('=>')) ||
        (trimmedLine.startsWith('var ') && trimmedLine.includes('=>')) ||
        trimmedLine.match(/^\s*\}/) ||
        trimmedLine.match(/^case\s+/) ||
        trimmedLine.match(/^default\s*:/)
      ) {
        return line;
      }

      // Linhas que precisam de ponto e vírgula
      if (
        trimmedLine.includes('console.') ||
        trimmedLine.includes('setFieldValue(') ||
        trimmedLine.includes('getFieldValue(') ||
        trimmedLine.includes('sendEmail(') ||
        trimmedLine.includes('return ') ||
        (trimmedLine.includes('=') && !trimmedLine.includes('=>')) ||
        trimmedLine.includes('await ') ||
        trimmedLine.includes('throw ') ||
        trimmedLine.includes('break') ||
        trimmedLine.includes('continue')
      ) {
        return line + (line.trim().endsWith(';') ? '' : ';');
      }

      return line;
    })
    .join('\n');

  // 6. Restaurar literais preservados na ordem correta

  // Restaurar comentários
  comments.forEach((comment, index) => {
    const placeholder = `__COMMENT_${index}__`;
    normalized = normalized.replace(placeholder, comment);
  });

  // Restaurar regex
  regexLiterals.forEach((regex, index) => {
    const placeholder = `__REGEX_LITERAL_${index}__`;
    normalized = normalized.replace(placeholder, regex);
  });

  // Restaurar strings
  stringLiterals.forEach((str, index) => {
    const placeholder = `__STRING_LITERAL_${index}__`;
    normalized = normalized.replace(placeholder, str);
  });

  // Restaurar template literals
  templateLiterals.forEach((template, index) => {
    const placeholder = `__TEMPLATE_LITERAL_${index}__`;
    normalized = normalized.replace(placeholder, template);
  });

  return normalized;
}

// Função para validação robusta de sintaxe JavaScript
function validateJavaScriptSyntax(
  normalizedCode: string,
  originalCode: string,
): { success: boolean; error?: string; code?: string; lineNumber?: number } {
  try {
    // Validação básica com Function constructor
    new Function('doc', 'emailServiceInstance', normalizedCode);
    return { success: true };
  } catch (syntaxError: any) {
    // Extrair informações detalhadas do erro
    const errorMessage = syntaxError.message || 'Erro de sintaxe desconhecido';

    // Tentar extrair número da linha do erro
    let lineNumber: number | undefined;
    const lineMatch =
      errorMessage.match(/line (\d+)/i) ||
      errorMessage.match(/position (\d+)/i);
    if (lineMatch) {
      lineNumber = parseInt(lineMatch[1], 10);
    }

    // Logs detalhados para debugging
    console.error('=== ERRO DE SINTAXE JAVASCRIPT ===');
    console.error('Erro:', errorMessage);
    console.error('Linha aproximada:', lineNumber || 'Não identificada');
    console.error('');
    console.error('Código original do usuário:');
    console.error('---');
    console.error(originalCode);
    console.error('---');
    console.error('');
    console.error('Código após normalização:');
    console.error('---');
    console.error(normalizedCode);
    console.error('---');
    console.error('===============================');

    // Tentar identificar a linha problemática no código original
    if (lineNumber) {
      const normalizedLines = normalizedCode.split('\n');

      console.error('Contexto do erro:');
      const contextStart = Math.max(0, lineNumber - 3);
      const contextEnd = Math.min(normalizedLines.length, lineNumber + 2);

      for (let i = contextStart; i < contextEnd; i++) {
        const marker = i === lineNumber - 1 ? ' >>> ' : '     ';
        console.error(`${marker}${i + 1}: ${normalizedLines[i] || ''}`);
      }
    }

    return {
      success: false,
      error: `Erro de sintaxe JavaScript: ${errorMessage}${lineNumber ? ` (aproximadamente linha ${lineNumber})` : ''}`,
      code: normalizedCode,
      lineNumber,
    };
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function HandlerFunction(
  code: string,
  doc: Record<string, any>,
  slug: string,
  fields: string[],
  context: {
    userAction?:
      | 'novo_registro'
      | 'editar_registro'
      | 'excluir_registro'
      | 'carregamento_formulario';
    executionMoment?:
      | 'carregamento_formulario'
      | 'antes_salvar'
      | 'depois_salvar';
    userId?: string;
    tableId?: string;
  } = {},
) {
  try {
    // Normaliza o slug e fields (remove hífens)
    const normalizedSlug = slug.replace(/-/g, '_');
    const normalizedFields = fields.map((f) => f.replace(/-/g, '_'));

    // Instancia EmailService para usar no closure
    const emailService = new EmailService();

    // Cria o código wrapper que declara as variáveis e atualiza o doc
    const placeholderDeclarations = normalizedFields
      .map((field) => {
        const placeholderWithoutDollar = `${normalizedSlug}_${field}`; // SEM $
        const originalField = fields[normalizedFields.indexOf(field)]; // pega o nome original
        return `let ${placeholderWithoutDollar} = doc['${originalField}'];`;
      })
      .join('\n');

    const placeholderUpdates = normalizedFields
      .map((field) => {
        const placeholderWithoutDollar = `${normalizedSlug}_${field}`; // SEM $
        const originalField = fields[normalizedFields.indexOf(field)]; // pega o nome original
        return `doc['${originalField}'] = ${placeholderWithoutDollar};`;
      })
      .join('\n');

    // Declarações de variáveis globais
    const globalVariables = `
      // Variáveis globais disponíveis
      const userAction = '${context.userAction || 'editar_registro'}';
      const executionMoment = '${context.executionMoment || 'antes_salvar'}';
      const userId = '${context.userId || ''}';
      const tableId = '${context.tableId || ''}';

      // Funções utilitárias
      function getFieldValue(fieldId) {
        // Suporta formato slug_campo e $tabela_campo
        const normalizedFieldId = fieldId.startsWith('$') ?
          fieldId.substring(1).replace(/_/g, '-') :
          fieldId.replace(/_/g, '-');
        return doc[normalizedFieldId] || doc[fieldId];
      }

      function setFieldValue(fieldId, value) {
        try {
          // Suporta formato slug_campo e $tabela_campo
          const normalizedFieldId = fieldId.startsWith('$') ?
            fieldId.substring(1).replace(/_/g, '-') :
            fieldId.replace(/_/g, '-');

          // Validação básica de tipos
          if (value !== null && value !== undefined) {
            // Se o valor for uma string que parece ser um número, converter
            if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
              const numValue = Number(value);
              if (Number.isInteger(numValue)) {
                value = numValue;
              } else {
                value = parseFloat(value);
              }
            }

            // Se o valor for uma string que parece ser um booleano, converter
            if (typeof value === 'string') {
              if (value.toLowerCase() === 'true') {
                value = true;
              } else if (value.toLowerCase() === 'false') {
                value = false;
              }
            }

            // Se o valor for uma string que parece ser uma data ISO, converter
            if (typeof value === 'string' && value.match(/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}/)) {
              const dateValue = new Date(value);
              if (!isNaN(dateValue.getTime())) {
                value = dateValue;
              }
            }
          }

          doc[normalizedFieldId] = value;
          doc[fieldId] = value; // Mantém compatibilidade

          return { success: true, value: value };
        } catch (error) {
          console.error('Erro ao definir valor do campo:', error);
          return { success: false, error: error.message };
        }
      }

      async function sendEmail(emails, subject, body) {
        try {
          // Validar parâmetros
          if (!Array.isArray(emails) || emails.length === 0) {
            return { success: false, message: 'Lista de emails inválida' };
          }

          if (!subject || !body) {
            return { success: false, message: 'Assunto e corpo do email são obrigatórios' };
          }

          // Chama o EmailService através do closure
          await emailServiceInstance.sendEmail({
            body: body,
            subject: subject,
            to: emails,
            from: 'noreply@lowcode.com',
          });

          return {
            success: true,
            message: 'Email enviado com sucesso',
            recipients: emails.length
          };
        } catch (error) {
          console.error('Erro na função sendEmail:', error);
          return { success: false, message: 'Erro interno ao enviar email' };
        }
      }
    `;

    // Validações iniciais
    if (!code || code.trim() === '') {
      console.warn('Código JavaScript vazio ou nulo');
      return { success: true };
    }

    // Normalização avançada de código JavaScript
    let normalizedCode = normalizeJavaScriptCode(code.trim());

    // Substituir placeholders $tabela_campo por tabela_campo (sem $)
    // console.log('=== DEBUG SUBSTITUIÇÃO ===');
    // console.log('normalizedSlug:', normalizedSlug);
    // console.log('normalizedFields:', normalizedFields);
    // console.log('Código antes da substituição:', normalizedCode);

    normalizedFields.forEach((field) => {
      const placeholderWithDollar = `\\$${normalizedSlug}_${field}`; // COM $ (regex)
      const placeholderWithoutDollar = `${normalizedSlug}_${field}`; // SEM $

      // console.log(
      //   `Substituindo: ${placeholderWithDollar} → ${placeholderWithoutDollar}`,
      // );

      // Usar regex global para substituir todas as ocorrências
      const regex = new RegExp(placeholderWithDollar, 'g');
      // const before = normalizedCode;
      normalizedCode = normalizedCode.replace(regex, placeholderWithoutDollar);

      // if (before !== normalizedCode) {
      //   console.log('Substituição realizada com sucesso!');
      // } else {
      //   console.log('Nenhuma substituição realizada');
      // }
    });

    // console.log('Código após substituição:', normalizedCode);
    // console.log('========================');

    // Validação de sintaxe robusta
    const syntaxValidation = validateJavaScriptSyntax(normalizedCode, code);
    if (!syntaxValidation.success) {
      return syntaxValidation;
    }

    const fullCode = `
      ${globalVariables}
      ${placeholderDeclarations}

      // === Código do usuário ===
      ${normalizedCode}
      // === Fim do código do usuário ===

      ${placeholderUpdates}
    `;

    // Executa com doc e emailServiceInstance como parâmetros
    const handler = new Function('doc', 'emailServiceInstance', fullCode);
    handler(doc, emailService);

    return { success: true };
  } catch (error: any) {
    console.error('=== ERRO NA EXECUÇÃO ===');
    console.error('Erro:', error.message);
    console.error('Código original do usuário:');
    console.error(code);
    console.error('========================');
    return {
      success: false,
      error: error.message,
      stack: error.stack,
    };
  }
}
