import type { FastifyRequest } from 'fastify';
import z from 'zod';

import type { Permission, Table } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { Table as TableModel } from '@application/model/table.model';
import { User as UserModel } from '@application/model/user.model';
import { PermissionSlugMapper } from '@config/util.config';

const ParamsSchema = z.object({
  slug: z.string().trim().min(1).optional(),
});

interface AccessOptions {
  requiredPermission: keyof typeof PermissionSlugMapper;
}

/**
 * Verifica se o usuário tem a permissão necessária no seu grupo
 */
async function checkUserHasPermission(
  userId: string,
  permission: keyof typeof PermissionSlugMapper,
): Promise<void> {
  const permissionSlug = PermissionSlugMapper[permission].toLowerCase();

  const user = await UserModel.findOne({ _id: userId })
    .populate({
      path: 'group',
      populate: { path: 'permissions' },
    })
    .lean();

  if (!user) {
    throw HTTPException.Forbidden('User not found', 'USER_NOT_FOUND');
  }

  if (user.status !== 'active') {
    throw HTTPException.Forbidden('User is not active', 'USER_NOT_ACTIVE');
  }

  const group = user.group as { permissions?: Permission[] } | undefined;

  if (!group?.permissions || !Array.isArray(group.permissions)) {
    throw HTTPException.Forbidden(
      'User group or permissions not found',
      'PERMISSIONS_NOT_FOUND',
    );
  }

  const hasPermission = group.permissions.some(
    (p) => p.slug?.toLowerCase() === permissionSlug,
  );

  if (!hasPermission) {
    throw HTTPException.Forbidden(
      `Permission denied. Required: ${permission}`,
      'INSUFFICIENT_PERMISSIONS',
    );
  }
}

/**
 * Middleware de acesso a tabelas simplificado
 *
 * Lógica:
 * 1. Tabela pública + VIEW → visitante pode ver
 * 2. Outras ações → login obrigatório + usuário ativo
 * 3. Se é dono ou admin da tabela → acesso total
 * 4. Se não → verifica permissão do grupo
 */
export function TableAccessMiddleware(options: AccessOptions) {
  const { requiredPermission } = options;

  return async function (request: FastifyRequest): Promise<void> {
    // 1. Validar parâmetro slug
    const params = ParamsSchema.safeParse(request.params);
    if (!params.success) {
      throw HTTPException.BadRequest(
        'Invalid parameters',
        'INVALID_PARAMETERS',
      );
    }

    const { slug } = params.data;

    // 2. Buscar tabela (exceto para CREATE_TABLE)
    let table: Table | undefined = request.table;

    if (slug && requiredPermission !== 'CREATE_TABLE') {
      if (!table) {
        table = (await TableModel.findOne({
          slug,
          trashed: false,
        }).lean()) as unknown as Table;

        if (!table) {
          throw HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND');
        }

        request.table = table;
      }
    }

    // 3. EXCEÇÃO PÚBLICA: tabela pública + VIEW → visitante pode ver/filtrar
    if (
      table &&
      table.configuration?.visibility === 'public' &&
      request.method === 'GET' &&
      ['VIEW_TABLE', 'VIEW_FIELD', 'VIEW_ROW'].includes(requiredPermission)
    ) {
      return;
    }

    // 4. EXCEÇÃO FORMULÁRIO: tabela form + POST CREATE_ROW → visitante pode criar registro
    if (
      table &&
      table.configuration?.visibility === 'form' &&
      request.method === 'POST' &&
      requiredPermission === 'CREATE_ROW'
    ) {
      return;
    }

    // 5. Exigir autenticação para todas as outras ações
    const user = request.user;
    if (!user) {
      throw HTTPException.Unauthorized(
        'User not authenticated',
        'USER_NOT_AUTHENTICATED',
      );
    }

    // 6. CREATE_TABLE: apenas verificar permissão do grupo
    if (requiredPermission === 'CREATE_TABLE') {
      await checkUserHasPermission(user.sub, requiredPermission);
      return;
    }

    // 7. Verificar se tabela existe para outras ações
    if (!table) {
      throw HTTPException.BadRequest(
        'Table is required for this action',
        'TABLE_REQUIRED',
      );
    }

    // 8. Verificar se é dono ou admin da tabela
    const isOwner = user.sub === table.configuration?.owner?.toString();
    const isTableAdmin = table.configuration?.administrators?.some(
      (a) => a?.toString() === user.sub,
    );

    request.ownership = { isOwner, isAdministrator: isTableAdmin };

    // Se é dono ou admin da tabela → acesso total (mas precisa estar ativo)
    if (isOwner || isTableAdmin) {
      // Verificar se usuário está ativo
      const userDoc = await UserModel.findOne({ _id: user.sub }).lean();
      if (!userDoc || userDoc.status !== 'active') {
        throw HTTPException.Forbidden('User is not active', 'USER_NOT_ACTIVE');
      }
      return;
    }

    // 9. Não é dono/admin → verificar permissão do grupo
    await checkUserHasPermission(user.sub, requiredPermission);
  };
}
