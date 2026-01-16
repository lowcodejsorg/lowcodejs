import type { FastifyRequest } from 'fastify';
import z from 'zod';

import {
  E_ROLE,
  E_TABLE_PERMISSION,
  E_TABLE_VISIBILITY,
  E_USER_STATUS,
  IPermission,
  ITable,
  ValueOf,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { Table as TableModel } from '@application/model/table.model';
import { User as UserModel } from '@application/model/user.model';

const ParamsSchema = z.object({
  slug: z.string().trim().min(1).optional(),
});

interface AccessOptions {
  requiredPermission: ValueOf<typeof E_TABLE_PERMISSION>;
}

/**
 * Verifica se o usuário tem a permissão necessária no seu grupo
 */
async function checkUserHasPermission(
  userId: string,
  permission: ValueOf<typeof E_TABLE_PERMISSION>,
): Promise<void> {
  const permissionSlug = E_TABLE_PERMISSION[permission];

  const user = await UserModel.findOne({ _id: userId })
    .populate({
      path: 'group',
      populate: { path: 'permissions' },
    })
    .lean();

  if (!user) throw HTTPException.Forbidden('User not found', 'USER_NOT_FOUND');

  if (user.status !== E_USER_STATUS.ACTIVE)
    throw HTTPException.Forbidden('User is not active', 'USER_NOT_ACTIVE');

  const group = user.group as { permissions?: IPermission[] } | undefined;

  if (!group?.permissions || !Array.isArray(group.permissions)) {
    throw HTTPException.Forbidden(
      'User group or permissions not found',
      'PERMISSIONS_NOT_FOUND',
    );
  }

  const hasPermission = group.permissions.some(
    (p) => p.slug === permissionSlug,
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
    let table: ITable | undefined = request.table;

    if (slug && requiredPermission !== E_TABLE_PERMISSION.CREATE_TABLE) {
      if (!table) {
        // Para operações de restore, buscar tabelas na lixeira
        const isRestoreOperation = request.url.endsWith('/restore');
        const query: { slug: string; trashed?: boolean } = { slug };

        if (!isRestoreOperation) {
          query.trashed = false;
        }

        table = (await TableModel.findOne(query).lean()) as unknown as ITable;

        if (!table) {
          throw HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND');
        }

        request.table = table;
      }
    }

    // 3. EXCEÇÃO PÚBLICA: tabela pública + VIEW → visitante pode ver/filtrar
    if (
      table &&
      table.configuration?.visibility === E_TABLE_VISIBILITY.PUBLIC &&
      request.method === 'GET' &&
      ['VIEW_TABLE', 'VIEW_FIELD', 'VIEW_ROW'].includes(requiredPermission)
    ) {
      return;
    }

    // 4. EXCEÇÃO FORMULÁRIO: tabela form + POST CREATE_ROW → visitante pode criar registro
    if (
      table &&
      table.configuration?.visibility === E_TABLE_VISIBILITY.FORM &&
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

    // 6. MASTER tem acesso total a tudo
    if (user.role === E_ROLE.MASTER) {
      return;
    }

    // 6.1. ADMINISTRATOR tem acesso total a TODAS as tabelas
    if (user.role === E_ROLE.ADMINISTRATOR) {
      const userDoc = await UserModel.findOne({ _id: user.sub }).lean();
      if (!userDoc || userDoc.status !== E_USER_STATUS.ACTIVE) {
        throw HTTPException.Forbidden('User is not active', 'USER_NOT_ACTIVE');
      }
      return;
    }

    // 7. CREATE_TABLE: apenas verificar permissão do grupo
    if (requiredPermission === E_TABLE_PERMISSION.CREATE_TABLE) {
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
      if (!userDoc || userDoc.status !== E_USER_STATUS.ACTIVE) {
        throw HTTPException.Forbidden('User is not active', 'USER_NOT_ACTIVE');
      }
      return;
    }

    // 9. Usuário logado NÃO é dono/admin → aplicar regras de visibilidade
    const visibility =
      table.configuration?.visibility || E_TABLE_VISIBILITY.RESTRICTED;

    // Ações que SEMPRE requerem dono/admin (independente da visibilidade)
    const ownerOnlyActions = [
      // Gerenciar campos
      E_TABLE_PERMISSION.CREATE_FIELD,
      E_TABLE_PERMISSION.UPDATE_FIELD,
      E_TABLE_PERMISSION.REMOVE_FIELD,
      // Gerenciar tabela
      E_TABLE_PERMISSION.UPDATE_TABLE,
      E_TABLE_PERMISSION.REMOVE_TABLE,
      // Editar/apagar registros
      E_TABLE_PERMISSION.UPDATE_ROW,
      E_TABLE_PERMISSION.REMOVE_ROW,
    ].flatMap((p) => p.toString());

    if (ownerOnlyActions.includes(requiredPermission)) {
      throw HTTPException.Forbidden(
        'Only table owner or administrators can perform this action',
        'OWNER_OR_ADMIN_REQUIRED',
      );
    }

    // 10. Regras específicas por visibilidade
    switch (visibility) {
      case E_TABLE_VISIBILITY.PRIVATE:
        // PRIVADA: Bloqueia TUDO para não-dono/admin
        throw HTTPException.Forbidden('This table is private', 'TABLE_PRIVATE');

      case E_TABLE_VISIBILITY.RESTRICTED:
        // RESTRITA: Só permite VIEW (CREATE_ROW bloqueado)
        if (requiredPermission === 'CREATE_ROW') {
          throw HTTPException.Forbidden(
            'Only owner/administrators can create records in restricted tables',
            'RESTRICTED_CREATE',
          );
        }
        break;

      case E_TABLE_VISIBILITY.OPEN:
        // ABERTA: Permite VIEW e CREATE_ROW (UPDATE/REMOVE já bloqueado acima)
        break;

      case E_TABLE_VISIBILITY.PUBLIC:
        // PÚBLICA: Permite VIEW e CREATE_ROW (UPDATE/REMOVE já bloqueado acima)
        break;

      case E_TABLE_VISIBILITY.FORM:
        // FORMULÁRIO: Bloqueia VIEW (CREATE_ROW já tratado para visitante acima)
        if (
          ['VIEW_TABLE', 'VIEW_FIELD', 'VIEW_ROW'].includes(requiredPermission)
        ) {
          throw HTTPException.Forbidden(
            'Only owner/administrators can view form tables',
            'FORM_VIEW_RESTRICTED',
          );
        }
        break;
    }

    // 11.  verificar se tem permissão no grupo
    await checkUserHasPermission(user.sub, requiredPermission);
  };
}
