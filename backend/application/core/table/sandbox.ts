import crypto from 'node:crypto';

import NodemailerEmailService from '@application/services/email/nodemailer-email.service';
import { Env } from '@start/env';

import {
  convertValue,
  normalizeSlug,
  resolveFieldValue,
} from './field-resolver';
import type {
  ContextApi,
  EmailApi,
  EmailResult,
  ExecutionContext,
  FieldApi,
  FieldDefinition,
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

    getLabel(slug: string, value?: string): string {
      const fieldDef = findFieldDef(slug);
      const val = value ?? String(resolveFieldValue(doc, slug) ?? '');
      if (!fieldDef?.dropdown || !Array.isArray(fieldDef.dropdown)) return val;
      const option = fieldDef.dropdown.find(
        (opt: any) => opt.id === val || opt.label === val,
      );
      return option?.label ?? val;
    },
  };

  // Build context API (read-only)
  const contextApi: ContextApi = Object.freeze({
    action: context.userAction,
    moment: context.executionMoment,
    userId: context.userId ?? '',
    isNew: context.isNew ?? false,
    appUrl: Env.APP_CLIENT_URL,
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
