import { FastifyReply, FastifyRequest } from 'fastify';
import { getInstanceByToken } from 'fastify-decorators';
import z from 'zod';

import {
  E_LOGGER_ACTION_TYPE,
  E_LOGGER_OBJECT_TYPE,
} from '@application/core/entity.core';
import {
  LoggerContractRepository,
  LoggerCreatePayload,
} from '@application/repositories/logger/logger-contract.repository';
import LoggerMongooseRepository from '@application/repositories/logger/logger-mongoose.repository';

const ACTION_MAP: Record<string, keyof typeof E_LOGGER_ACTION_TYPE> = {
  GET: E_LOGGER_ACTION_TYPE.VIEW,
  POST: E_LOGGER_ACTION_TYPE.CREATE,
  PUT: E_LOGGER_ACTION_TYPE.UPDATE,
  PATCH: E_LOGGER_ACTION_TYPE.UPDATE,
  DELETE: E_LOGGER_ACTION_TYPE.DELETE,
};

/**
 * Ordem importa: mais específico primeiro.
 * Rotas aninhadas como /tables/:slug/rows/:id/groups/:groupSlug
 * devem bater em GROUP_ROW antes de ROW ou TABLE.
 */
const OBJECT_MAP: Array<{
  match: string;
  object: keyof typeof E_LOGGER_OBJECT_TYPE;
}> = [
  // ── Nested (mais específico primeiro) ──
  { match: '/groups', object: E_LOGGER_OBJECT_TYPE.GROUP_ROW },
  { match: '/fields', object: E_LOGGER_OBJECT_TYPE.FIELD },
  { match: '/rows', object: E_LOGGER_OBJECT_TYPE.ROW },

  // ── Top-level ──
  { match: '/tables', object: E_LOGGER_OBJECT_TYPE.TABLE },
  { match: '/users', object: E_LOGGER_OBJECT_TYPE.USER },
  { match: '/user-group', object: E_LOGGER_OBJECT_TYPE.USER_GROUP },
  { match: '/menu', object: E_LOGGER_OBJECT_TYPE.MENU },
  { match: '/extensions', object: E_LOGGER_OBJECT_TYPE.EXTENSION },
  { match: '/pages', object: E_LOGGER_OBJECT_TYPE.PAGE },
  { match: '/permissions', object: E_LOGGER_OBJECT_TYPE.PERMISSION },
  { match: '/profile', object: E_LOGGER_OBJECT_TYPE.PROFILE },
  { match: '/setting', object: E_LOGGER_OBJECT_TYPE.SETTING },
  { match: '/setup', object: E_LOGGER_OBJECT_TYPE.SETUP },
  { match: '/storage', object: E_LOGGER_OBJECT_TYPE.STORAGE },
];

/**
 * Segmentos que NÃO são IDs — usados pelo fallbackIdFromUrl
 * para ignorar partes estáticas da URL.
 */
const NON_ID_SEGMENTS = new Set([
  'users',
  'tables',
  'rows',
  'fields',
  'groups',
  'menu',
  'extensions',
  'pages',
  'permissions',
  'profile',
  'setting',
  'setup',
  'storage',
  'user-group',
  'authentication',
  'tools',
  // sub-rotas estáticas
  'paginated',
  'exports',
  'csv',
  'bulk-delete',
  'bulk-restore',
  'bulk-trash',
  'empty-trash',
  'restore',
  'trash',
  'reorder',
  'migration',
  'start',
  'cleanup',
  'status',
  'active',
  'toggle',
  'table-scope',
  'category',
  'evaluation',
  'forum',
  'messages',
  'mention-read',
  'reaction',
  'sign-in',
  'sign-up',
  'sign-out',
  'refresh-token',
  'magic-link',
  'recovery',
  'request-code',
  'validate-code',
  'update-password',
  'health-check',
  'step',
  'admin',
  'email',
  'logos',
  'name',
  'paging',
  'upload',
  'clone-table',
  'export-table',
  'import-table',
]);

function resolveObject(
  route: string,
): keyof typeof E_LOGGER_OBJECT_TYPE | null {
  if (!route) return null;

  for (const { match, object } of OBJECT_MAP) {
    if (route.includes(match)) return object;
  }

  return null;
}

function resolveAction(method: string): keyof typeof E_LOGGER_ACTION_TYPE {
  return ACTION_MAP[method.toUpperCase()] ?? E_LOGGER_ACTION_TYPE.VIEW;
}

/**
 * Prioridade de params nomeados pelo Fastify (ex: :rowId, :fieldId, :_id).
 */
function resolveObjectId(params: FastifyRequest['params'] = {}): string | null {
  const priority = [
    'itemId',
    'messageId',
    'fieldId',
    'rowId',
    '_id',
    'id',
    'slug',
    'groupSlug', // menos prioritário — é slug de grupo, não de objeto principal
  ];

  for (const key of priority) {
    const value = (params as Record<string, string>)?.[key];
    if (value) return value;
  }

  return null;
}

/**
 * Fallback: varre a URL de trás pra frente e retorna
 * o primeiro segmento que parece ser um ID (não está em NON_ID_SEGMENTS).
 */
function fallbackIdFromUrl(url: string): string | null {
  // Remove query string antes de processar
  const path = url.split('?')[0];
  const parts = path.split('/').filter(Boolean).reverse();

  for (const part of parts) {
    if (!NON_ID_SEGMENTS.has(part)) return part;
  }

  return null;
}

const bodySchema = z.record(z.string(), z.unknown());

export async function LoggerUserActionHook(
  request: FastifyRequest,
  response: FastifyReply,
): Promise<void> {
  try {
    const repo = getInstanceByToken<LoggerContractRepository>(
      LoggerMongooseRepository,
    );

    // Usa o padrão da rota (ex: /tables/:slug/rows/:_id) para resolver o object
    // e a URL real para resolver o object_id via fallback.
    const routePattern = request.routeOptions?.url ?? request.url;

    const method = request.method.toUpperCase();
    const isRelevantMethod = ['POST', 'PUT', 'PATCH'].includes(method);
    const isJson =
      request.headers['content-type']?.includes('application/json');

    let content: Record<string, unknown> | null = null;

    if (isRelevantMethod) {
      if (isJson) {
        const parsed = bodySchema.safeParse(request.body);
        if (parsed.success) content = parsed.data;
      } else {
        content = { raw: '[Non-JSON payload]' };
      }
    }

    const action = resolveAction(method);
    const object = resolveObject(routePattern);
    const object_id =
      resolveObjectId(request.params) ?? fallbackIdFromUrl(request.url);
    const user_id = response.request.user?.sub ?? null;

    // Não loga rotas que não mapeiam para nenhum objeto conhecido
    if (!object) return;

    const payload = {
      action,
      url: request.url,
      user_id,
      content,
      object,
      object_id,
    } satisfies LoggerCreatePayload;

    await repo.create(payload);
  } catch (err) {
    // Nunca deixar o hook de log derrubar a requisição
    console.error('[Logger Hook] Failed to create log entry:', err);
  }
}
