import crypto from 'node:crypto';

import NodemailerEmailService from '@application/services/email/nodemailer-email.service';

import {
  convertValue,
  normalizeSlug,
  resolveFieldValue,
} from './field-resolver';
import type {
  ContextApi,
  DbApi,
  DbQueryOptions,
  DbQueryResult,
  EmailApi,
  EmailResult,
  ExecutionContext,
  FieldApi,
  FieldDefinition,
  RelatedQueryOptions,
  RelatedQueryResult,
  SandboxGlobals,
  UtilsApi,
} from './types';

export interface BuildSandboxParams {
  doc: Record<string, any>;
  tableSlug: string;
  fields: FieldDefinition[];
  context: ExecutionContext;
  logs: string[];
}

/**
 * Builds the sandbox environment for script execution
 */
export function buildSandbox(params: BuildSandboxParams): SandboxGlobals {
  const { doc, tableSlug, fields, context, logs } = params;

  // Email service instance
  const emailService = new NodemailerEmailService();

  // Helper to find field definition by slug (handles variations)
  const findFieldDef = (slug: string): FieldDefinition | undefined => {
    return fields.find(
      (f) =>
        f.slug === slug ||
        normalizeSlug(f.slug) === normalizeSlug(slug) ||
        f.slug.replace(/-/g, '_') === slug ||
        f.slug === slug.replace(/_/g, '-'),
    );
  };

  // Build field API
  const field: FieldApi = {
    get(slug: string): any {
      return resolveFieldValue(doc, slug);
    },

    set(slug: string, value: any): void {
      const converted = convertValue(value);
      const fieldDef = findFieldDef(slug);
      const originalSlug = fieldDef?.slug ?? slug;
      doc[originalSlug] = converted;
    },

    getAll(): Record<string, any> {
      const result: Record<string, any> = {};
      for (const f of fields) {
        result[f.slug] = doc[f.slug];
      }
      return result;
    },

    async getRelated(slug: string): Promise<Record<string, any> | null> {
      const fieldDef = findFieldDef(slug);

      if (!fieldDef) {
        throw new Error(`Campo "${slug}" não encontrado`);
      }

      if (fieldDef.type !== 'RELATIONSHIP') {
        throw new Error(
          `Campo "${slug}" não é do tipo RELATIONSHIP. Tipo atual: ${fieldDef.type}`,
        );
      }

      if (!fieldDef.relationship?.table?.slug) {
        throw new Error(
          `Campo "${slug}" não possui uma tabela relacionada configurada`,
        );
      }

      const fieldValue = resolveFieldValue(doc, fieldDef.slug);

      if (!fieldValue) {
        return null;
      }

      // Handle multiple values (array of IDs)
      const ids = Array.isArray(fieldValue) ? fieldValue : [fieldValue];

      if (ids.length === 0) {
        return null;
      }

      // Get the first ID (for single relationship)
      const id = ids[0]?.toString?.() ?? ids[0];

      if (!id) {
        return null;
      }

      try {
        const { Table } = await import('@application/model/table.model');
        const { buildTable } = await import('@application/core/util.core');

        const relatedTableSlug = fieldDef.relationship.table.slug;
        const relatedTable = await Table.findOne({ slug: relatedTableSlug });

        if (!relatedTable) {
          throw new Error(
            `Tabela relacionada "${relatedTableSlug}" não encontrada`,
          );
        }

        const model = await buildTable({
          ...relatedTable.toJSON({ flattenObjectIds: true }),
          _id: relatedTable._id.toString(),
        });

        const result = await model.findById(id).lean();

        if (!result) {
          return null;
        }

        return { ...result, _id: (result as any)._id.toString() };
      } catch (error: any) {
        throw new Error(
          `Erro ao buscar registro relacionado: ${error.message}`,
        );
      }
    },

    async queryRelated(
      slug: string,
      options?: RelatedQueryOptions,
    ): Promise<RelatedQueryResult> {
      const fieldDef = findFieldDef(slug);

      if (!fieldDef) {
        throw new Error(`Campo "${slug}" não encontrado`);
      }

      if (fieldDef.type !== 'RELATIONSHIP') {
        throw new Error(
          `Campo "${slug}" não é do tipo RELATIONSHIP. Tipo atual: ${fieldDef.type}`,
        );
      }

      if (!fieldDef.relationship?.table?.slug) {
        throw new Error(
          `Campo "${slug}" não possui uma tabela relacionada configurada`,
        );
      }

      try {
        const { Table } = await import('@application/model/table.model');
        const { buildTable } = await import('@application/core/util.core');

        const relatedTableSlug = fieldDef.relationship.table.slug;
        const relatedTable = await Table.findOne({ slug: relatedTableSlug });

        if (!relatedTable) {
          throw new Error(
            `Tabela relacionada "${relatedTableSlug}" não encontrada`,
          );
        }

        const model = await buildTable({
          ...relatedTable.toJSON({ flattenObjectIds: true }),
          _id: relatedTable._id.toString(),
        });

        const where = options?.where ?? {};
        const limit = Math.min(options?.limit ?? 100, 100);
        const orderBy = options?.orderBy ?? {};

        let query = model.find(where);

        if (Object.keys(orderBy).length > 0) {
          query = query.sort(orderBy);
        }

        query = query.limit(limit);

        const [results, total] = await Promise.all([
          query.lean(),
          model.countDocuments(where),
        ]);

        return {
          data: results.map((r: any) => ({ ...r, _id: r._id.toString() })),
          total,
        };
      } catch (error: any) {
        throw new Error(
          `Erro ao consultar tabela relacionada: ${error.message}`,
        );
      }
    },
  };

  // Build context API (read-only)
  const contextApi: ContextApi = Object.freeze({
    action: context.userAction,
    moment: context.executionMoment,
    userId: context.userId ?? '',
    isNew: context.isNew ?? false,
    table: Object.freeze(
      context.tableInfo ?? {
        _id: '',
        name: '',
        slug: tableSlug,
      },
    ),
  });

  // Build email API
  const email: EmailApi = {
    async send(
      to: string[],
      subject: string,
      body: string,
    ): Promise<EmailResult> {
      try {
        if (!Array.isArray(to) || to.length === 0) {
          return { success: false, message: 'Lista de emails inválida' };
        }
        if (!subject || !body) {
          return {
            success: false,
            message: 'Assunto e corpo do email são obrigatórios',
          };
        }

        await emailService.sendEmail({
          body,
          subject,
          to,
          from: 'noreply@lowcode.com',
        });

        return {
          success: true,
          message: 'Email enviado com sucesso',
          recipients: to.length,
        };
      } catch (error: any) {
        console.error('Erro na função email.send:', error);
        return { success: false, message: 'Erro interno ao enviar email' };
      }
    },

    async sendTemplate(
      to: string[],
      subject: string,
      message: string,
      data?: Record<string, any>,
    ): Promise<EmailResult> {
      try {
        if (!Array.isArray(to) || to.length === 0) {
          return { success: false, message: 'Lista de emails inválida' };
        }
        if (!subject || !message) {
          return {
            success: false,
            message: 'Assunto e mensagem são obrigatórios',
          };
        }

        const body = await emailService.buildTemplate({
          template: 'notification',
          data: {
            title: subject,
            message,
            data: data ?? {},
          },
        });

        await emailService.sendEmail({
          body,
          subject,
          to,
          from: 'noreply@lowcode.com',
        });

        return {
          success: true,
          message: 'Email enviado com sucesso',
          recipients: to.length,
        };
      } catch (error: any) {
        console.error('Erro na função email.sendTemplate:', error);
        return { success: false, message: 'Erro interno ao enviar email' };
      }
    },
  };

  // Build utils API
  const utils: UtilsApi = {
    today(): Date {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    },

    now(): Date {
      return new Date();
    },

    formatDate(date: Date, format: string = 'dd/MM/yyyy'): string {
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '';
      }

      const pad = (n: number): string => n.toString().padStart(2, '0');

      const day = pad(date.getDate());
      const month = pad(date.getMonth() + 1);
      const year = date.getFullYear().toString();
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      const seconds = pad(date.getSeconds());

      return format
        .replace('dd', day)
        .replace('MM', month)
        .replace('yyyy', year)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
    },

    sha256(text: string): string {
      return crypto.createHash('sha256').update(text).digest('hex');
    },

    uuid(): string {
      return crypto.randomUUID();
    },
  };

  // Build db API for querying related tables
  const allowedTables = fields
    .filter((f) => f.relationship?.table?.slug)
    .map((f) => f.relationship!.table.slug);

  const db: DbApi = {
    async query(
      tableSlug: string,
      options?: DbQueryOptions,
    ): Promise<DbQueryResult[]> {
      // Validate that table is related
      if (!allowedTables.includes(tableSlug)) {
        const available =
          allowedTables.length > 0
            ? allowedTables.join(', ')
            : 'nenhuma tabela relacionada';
        throw new Error(
          `Tabela "${tableSlug}" não está relacionada com esta tabela. Tabelas disponíveis: ${available}`,
        );
      }

      try {
        const { Table } = await import('@application/model/table.model');
        const { buildTable } = await import('@application/core/util.core');

        const relatedTable = await Table.findOne({ slug: tableSlug }).populate(
          'fields',
        );
        if (!relatedTable) {
          throw new Error(`Tabela "${tableSlug}" não encontrada`);
        }

        const model = await buildTable({
          ...relatedTable.toJSON({ flattenObjectIds: true }),
          _id: relatedTable._id.toString(),
        });

        let query = model.find(options?.where ?? {});

        if (options?.select?.length) {
          query = query.select(options.select.join(' '));
        }

        if (options?.orderBy) {
          query = query.sort(options.orderBy);
        }

        const limit = Math.min(options?.limit ?? 100, 100);
        query = query.limit(limit);

        const results = await query.lean();
        return results.map((r: any) => ({ ...r, _id: r._id.toString() }));
      } catch (error: any) {
        throw new Error(
          `Erro ao consultar tabela "${tableSlug}": ${error.message}`,
        );
      }
    },

    async findById(
      tableSlug: string,
      id: string,
    ): Promise<DbQueryResult | null> {
      if (!id) return null;
      const results = await this.query(tableSlug, {
        where: { _id: id },
        limit: 1,
      });
      return results[0] ?? null;
    },

    async findOne(
      tableSlug: string,
      where: Record<string, any>,
    ): Promise<DbQueryResult | null> {
      const results = await this.query(tableSlug, { where, limit: 1 });
      return results[0] ?? null;
    },
  };

  // Build console with log interception
  const interceptedConsole = {
    log: (...args: any[]): void => {
      logs.push(
        args
          .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
          .join(' '),
      );
    },
    warn: (...args: any[]): void => {
      logs.push(
        '[WARN] ' +
          args
            .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
            .join(' '),
      );
    },
    error: (...args: any[]): void => {
      logs.push(
        '[ERROR] ' +
          args
            .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
            .join(' '),
      );
    },
  };

  // Build sandbox with all APIs and builtins
  const sandbox: SandboxGlobals = {
    // API
    field,
    context: contextApi,
    email,
    utils,
    db,

    // Console (intercepted)
    console: interceptedConsole,

    // Builtins
    JSON,
    Date,
    Math,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Number,
    String,
    Boolean,
    Array,
    Object,
    RegExp,
    Map,
    Set,
    Promise,
    Error,
    TypeError,
    RangeError,
    SyntaxError,
    encodeURIComponent,
    decodeURIComponent,
    encodeURI,
    decodeURI,
  };

  return sandbox;
}
