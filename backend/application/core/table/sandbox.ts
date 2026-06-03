import crypto from 'node:crypto';

import { E_NOTIFICATION_TYPE } from '@application/core/entity.core';
import { User } from '@application/model/user.model';
import NotificationMongooseRepository from '@application/repositories/notification/notification-mongoose.repository';
import NodemailerEmailService from '@application/services/email/nodemailer-email.service';
import NotificationService from '@application/services/notification/notification.service';
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
  NotifyApi,
  SandboxGlobals,
  SandboxUser,
  UsersApi,
  UtilsApi,
} from './types';

/**
 * Normaliza ids de usuário em qualquer formato aceito pelos campos USER:
 * string, ObjectId, objeto populado ({ _id }), arrays e arrays aninhados.
 * Retorna ids únicos como string.
 */
function normalizeUserIds(input: unknown): string[] {
  const out: string[] = [];

  const push = (value: unknown): void => {
    if (!value) return;
    if (Array.isArray(value)) {
      for (const item of value) push(item);
      return;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) out.push(trimmed);
      return;
    }
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const nested = obj._id ?? obj.id;
      if (nested) {
        const asString = String(nested);
        if (asString && asString !== '[object Object]') out.push(asString);
        return;
      }
      // ObjectId e similares: String() devolve o hex.
      const asString = String(value);
      if (asString && asString !== '[object Object]') out.push(asString);
      return;
    }
    const asString = String(value);
    if (asString) out.push(asString);
  };

  push(input);

  return Array.from(new Set(out));
}

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
    reentrant: context.viaSaveHook ?? false,
    previous: context.previous ?? null,
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

  // Build users API — resolve ids de campos USER/CREATOR em { _id, name, email }.
  // Roda no host (fora da VM), com acesso ao model User (conexão system).
  const users: UsersApi = {
    async resolve(ids: unknown): Promise<SandboxUser[]> {
      const list = normalizeUserIds(ids);
      if (list.length === 0) return [];
      try {
        const docs = await User.find({
          _id: { $in: list },
          trashed: { $ne: true },
        })
          .select('name email _id')
          .lean();

        return docs.map((doc: any) => ({
          _id: String(doc._id),
          name: String(doc.name ?? ''),
          email: String(doc.email ?? ''),
        }));
      } catch (error: any) {
        console.error('Erro na função users.resolve:', error);
        return [];
      }
    },

    async emails(ids: unknown): Promise<string[]> {
      const resolved = await users.resolve(ids);
      return Array.from(
        new Set(
          resolved
            .map((user) => user.email.trim().toLowerCase())
            .filter(Boolean),
        ),
      );
    },
  };

  // Build notify API — cria notificações in-app (uma por usuário) + socket.
  const notify: NotifyApi = {
    async send(input): Promise<{ success: boolean; recipients: number }> {
      try {
        const userIds = normalizeUserIds(input?.userIds);
        if (userIds.length === 0) return { success: true, recipients: 0 };
        if (!input?.title) {
          return { success: false, recipients: 0 };
        }

        const service = new NotificationService(
          new NotificationMongooseRepository(),
        );

        const records = await service.notify({
          userIds,
          type: (input.type as any) ?? E_NOTIFICATION_TYPE.GENERIC,
          title: String(input.title),
          body: input.body ?? null,
          action: input.action ?? null,
          source: input.source ?? null,
          actorUserId: input.actorUserId ?? context.userId ?? null,
        });

        return { success: true, recipients: records.length };
      } catch (error: any) {
        console.error('Erro na função notify.send:', error);
        return { success: false, recipients: 0 };
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
    users,
    notify,
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
