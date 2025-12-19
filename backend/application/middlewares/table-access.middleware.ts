// src/middleware/table-access.middleware.ts
import type { FastifyRequest } from 'fastify';
import z from 'zod';

import type { Table } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { Table as Model } from '@application/model/table.model';
import { GroupSlugMapper, PermissionSlugMapper } from '@config/util.config';

const ParamsSchema = z.object({
  slug: z.string().trim().min(1).optional(), // ✅ OPCIONAL AGORA
});

interface AccessOptions {
  /** Permissão necessária da sua lista de permissões */
  requiredPermission: keyof typeof PermissionSlugMapper;

  /** Grupos permitidos (opcional - validação adicional) */
  allowedGroups?: (keyof typeof GroupSlugMapper)[];
}

export function TableAccessMiddleware(options: AccessOptions) {
  const { requiredPermission, allowedGroups } = options;

  return async function (request: FastifyRequest): Promise<void> {
    // 1. VALIDAR SLUG DA TABELA (se houver)
    const params = ParamsSchema.safeParse(request.params);
    if (!params.success) {
      throw HTTPException.BadRequest(
        'Invalid parameters',
        'INVALID_PARAMETERS',
      );
    }

    const { slug } = params.data;

    // 2. BUSCAR TABELA (apenas se slug existir e não for CREATE_TABLE)
    let table: Table | undefined = request.table;

    if (slug && requiredPermission !== 'CREATE_TABLE') {
      if (!table) {
        table = (await Model.findOne({
          slug,
          trashed: false,
        }).lean()) as unknown as Table;

        if (!table) {
          throw HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND');
        }

        request.table = table;
      }
    }

    // ✅ SE FOR CREATE_TABLE, não precisa de tabela
    if (requiredPermission === 'CREATE_TABLE') {
      const user = request.user;
      if (!user) {
        throw HTTPException.Unauthorized(
          'User not authenticated',
          'USER_NOT_AUTHENTICATED',
        );
      }

      const userGroup = user.role?.toLowerCase();
      const isMaster = userGroup === GroupSlugMapper.MASTER?.toLowerCase();
      const isAdminGroup =
        userGroup === GroupSlugMapper.ADMINISTRATOR?.toLowerCase();
      const isRegistered =
        userGroup === GroupSlugMapper.REGISTERED?.toLowerCase();

      // REGISTERED não pode criar tabelas
      if (isRegistered && !isMaster && !isAdminGroup) {
        throw HTTPException.Forbidden(
          'Registered users cannot create new tables',
          'INSUFFICIENT_ROLE',
        );
      }

      // Validar permissão no array de permissões
      // if (!user.permissions || !Array.isArray(user.permissions)) {
      //   throw HTTPException.Forbidden(
      //     'User permissions not found',
      //     'USER_PERMISSIONS_NOT_FOUND',
      //   );
      // }

      // const permissionSlug =
      PermissionSlugMapper[requiredPermission].toLowerCase();
      // const hasPermission = user.permissions.includes(permissionSlug);

      // if (!hasPermission && !isMaster) {
      //   throw HTTPException.Forbidden(
      //     `You don't have permission to perform this action. Required: ${requiredPermission}`,
      //     'INSUFFICIENT_PERMISSIONS',
      //   );
      // }

      // Validar allowedGroups (se especificado)
      if (allowedGroups && allowedGroups.length > 0) {
        if (!user.role) {
          throw HTTPException.Forbidden(
            'User group not found',
            'USER_GROUP_NOT_FOUND',
          );
        }

        const allowedGroupSlugs = allowedGroups
          .map((g) => GroupSlugMapper[g]?.toLowerCase())
          .filter(Boolean);

        const hasGroup = allowedGroupSlugs.includes(userGroup);

        if (!hasGroup && !isMaster) {
          throw HTTPException.Forbidden(
            `This action requires one of these roles: ${allowedGroups.join(', ')}`,
            'INSUFFICIENT_ROLE',
          );
        }
      }

      return; // ✅ Finaliza aqui para CREATE_TABLE
    }

    // ✅ DAQUI PRA FRENTE: precisa de tabela
    if (!table) {
      throw HTTPException.BadRequest(
        'Table is required for this action',
        'TABLE_REQUIRED',
      );
    }

    const visibility = table.configuration?.visibility;
    const method = request.method;

    // 3. REGRAS PARA NÃO-LOGADOS (visitantes)

    // Pública + GET (VIEW_TABLE, VIEW_FIELD, VIEW_ROW): visitante pode ver
    if (
      visibility === 'public' &&
      method === 'GET' &&
      ['VIEW_TABLE', 'VIEW_FIELD', 'VIEW_ROW'].includes(requiredPermission)
    ) {
      return;
    }

    // Formulário + POST (CREATE_ROW): visitante pode adicionar
    if (
      visibility === 'form' &&
      method === 'POST' &&
      requiredPermission === 'CREATE_ROW'
    ) {
      return;
    }

    // 4. DAQUI PRA FRENTE PRECISA ESTAR LOGADO
    const user = request.user;
    if (!user) {
      throw HTTPException.Unauthorized(
        'User not authenticated',
        'USER_NOT_AUTHENTICATED',
      );
    }

    // 5. VERIFICAR PROPRIEDADE DA TABELA E GRUPO
    const isOwner = user.sub === table.configuration?.owner?.toString();
    const isTableAdmin = table.configuration?.administrators?.some(
      (a) => a?.toString() === user.sub,
    );
    const isOwnerOrTableAdmin = isOwner || isTableAdmin;

    const userGroup = user.role?.toLowerCase();
    const isMaster = userGroup === GroupSlugMapper.MASTER?.toLowerCase();
    const isAdminGroup =
      userGroup === GroupSlugMapper.ADMINISTRATOR?.toLowerCase();
    const isManager = userGroup === GroupSlugMapper.MANAGER?.toLowerCase();
    const isRegistered =
      userGroup === GroupSlugMapper.REGISTERED?.toLowerCase();

    console.log({
      userGroup,
      isOwner,
      isTableAdmin,
      isOwnerOrTableAdmin,
      isMaster,
      isAdminGroup,
      isManager,
      isRegistered,
    });

    request.ownership = { isOwner, isAdministrator: isTableAdmin };

    // 6. APLICAR REGRAS DA MATRIZ DE PERMISSÕES

    // PRIVADA: Apenas dono e convidados para TUDO
    if (
      visibility === 'private' &&
      !isOwnerOrTableAdmin &&
      !isMaster &&
      !isAdminGroup
    ) {
      throw HTTPException.Forbidden(
        'Only owner and guests can access this private table',
        'TABLE_ACCESS_DENIED',
      );
    }

    // VIEW_TABLE, VIEW_FIELD, VIEW_ROW (Visualizar)
    if (['VIEW_TABLE', 'VIEW_FIELD', 'VIEW_ROW'].includes(requiredPermission)) {
      // ✅ TODOS OS USUÁRIOS LOGADOS PODEM VISUALIZAR (exceto privada e form que já foram validados)

      // Formulário: apenas dono e convidados
      if (
        visibility === 'form' &&
        !isOwnerOrTableAdmin &&
        !isMaster &&
        !isAdminGroup
      ) {
        throw HTTPException.Forbidden(
          'Only owner and guests can view this form table',
          'TABLE_ACCESS_DENIED',
        );
      }

      // ✅ Para Restrita, Aberta e Pública: qualquer usuário logado pode ver
      return; // ✅ Libera visualização
    }

    // CREATE_ROW (Adicionar registro)
    if (requiredPermission === 'CREATE_ROW') {
      // Privada: apenas dono e convidados
      if (
        visibility === 'private' &&
        !isOwnerOrTableAdmin &&
        !isMaster &&
        !isAdminGroup
      ) {
        throw HTTPException.Forbidden(
          'Only owner and guests can add records to this private table',
          'TABLE_ACCESS_DENIED',
        );
      }

      // Restrita: apenas dono e convidados
      if (
        visibility === 'restricted' &&
        !isOwnerOrTableAdmin &&
        !isMaster &&
        !isAdminGroup
      ) {
        throw HTTPException.Forbidden(
          'Only owner and guests can add records to this restricted table',
          'TABLE_ACCESS_DENIED',
        );
      }

      // ✅ Aberta, Pública, Formulário: qualquer usuário logado pode criar
    }

    // UPDATE_ROW ou REMOVE_ROW (Editar/apagar registros)
    if (['UPDATE_ROW', 'REMOVE_ROW'].includes(requiredPermission)) {
      // TODAS as visibilidades: apenas dono e convidados (MASTER e ADMINISTRATOR também)
      if (!isOwnerOrTableAdmin && !isMaster && !isAdminGroup) {
        throw HTTPException.Forbidden(
          'Only owner and guests can modify records',
          'TABLE_ACCESS_DENIED',
        );
      }

      // REGISTERED só pode em tabelas onde é ADMIN (não dono)
      if (isRegistered && !isTableAdmin && !isMaster && !isAdminGroup) {
        throw HTTPException.Forbidden(
          'Registered users can only modify records in tables where they are administrators',
          'TABLE_ACCESS_DENIED',
        );
      }

      // MANAGER só pode em tabelas próprias ou onde é admin
      if (isManager && !isOwnerOrTableAdmin && !isMaster && !isAdminGroup) {
        throw HTTPException.Forbidden(
          'Managers can only modify records in tables they own or administer',
          'TABLE_ACCESS_DENIED',
        );
      }
    }

    // CREATE_FIELD, UPDATE_FIELD, REMOVE_FIELD (Gerenciar campos)
    if (
      ['CREATE_FIELD', 'UPDATE_FIELD', 'REMOVE_FIELD'].includes(
        requiredPermission,
      )
    ) {
      // TODAS as visibilidades: apenas dono e convidados (MASTER e ADMINISTRATOR também)
      if (!isOwnerOrTableAdmin && !isMaster && !isAdminGroup) {
        throw HTTPException.Forbidden(
          'Only owner and guests can manage fields',
          'TABLE_ACCESS_DENIED',
        );
      }

      // REGISTERED só pode gerenciar campos onde é ADMIN (não dono)
      if (isRegistered && !isTableAdmin && !isMaster && !isAdminGroup) {
        throw HTTPException.Forbidden(
          'Registered users can only manage fields in tables where they are administrators',
          'INSUFFICIENT_ROLE',
        );
      }

      // MANAGER só pode gerenciar campos em tabelas próprias ou onde é admin
      if (isManager && !isOwnerOrTableAdmin && !isMaster && !isAdminGroup) {
        throw HTTPException.Forbidden(
          'Managers can only manage fields in tables they own or administer',
          'INSUFFICIENT_ROLE',
        );
      }
    }

    // UPDATE_TABLE, REMOVE_TABLE (Gerenciar tabela)
    if (['UPDATE_TABLE', 'REMOVE_TABLE'].includes(requiredPermission)) {
      // REGISTERED só pode onde é ADMIN (não dono)
      if (isRegistered && !isTableAdmin && !isMaster && !isAdminGroup) {
        throw HTTPException.Forbidden(
          'Registered users can only manage tables where they are administrators',
          'INSUFFICIENT_ROLE',
        );
      }

      // MANAGER só pode em tabelas próprias ou onde é admin
      if (isManager && !isOwnerOrTableAdmin && !isMaster && !isAdminGroup) {
        throw HTTPException.Forbidden(
          'Managers can only manage tables they own or administer',
          'TABLE_ACCESS_DENIED',
        );
      }

      // Outros: dono, admin da tabela, MASTER ou ADMINISTRATOR
      if (!isOwnerOrTableAdmin && !isMaster && !isAdminGroup) {
        throw HTTPException.Forbidden(
          'Only owner and guests can manage this table',
          'TABLE_ACCESS_DENIED',
        );
      }
    }

    // 7. VALIDAR PERMISSÃO NO GRUPO DO USUÁRIO
    // if (!user.permissions || !Array.isArray(user.permissions)) {
    //   throw HTTPException.Forbidden(
    //     'User permissions not found',
    //     'USER_PERMISSIONS_NOT_FOUND',
    //   );
    // }

    // const permissionSlug =
    //   PermissionSlugMapper[requiredPermission].toLowerCase();
    // const hasPermission = user.permissions.includes(permissionSlug);

    // if (!hasPermission && !isMaster) {
    //   throw HTTPException.Forbidden(
    //     `You don't have permission to perform this action. Required: ${requiredPermission}`,
    //     'INSUFFICIENT_PERMISSIONS',
    //   );
    // }

    // 8. VALIDAR GRUPO (se especificado)
    if (allowedGroups && allowedGroups.length > 0) {
      if (!user.role) {
        throw HTTPException.Forbidden(
          'User group not found',
          'USER_GROUP_NOT_FOUND',
        );
      }

      const allowedGroupSlugs = allowedGroups
        .map((g) => GroupSlugMapper[g]?.toLowerCase())
        .filter(Boolean);

      const hasGroup = allowedGroupSlugs.includes(userGroup);

      if (!hasGroup && !isMaster) {
        throw HTTPException.Forbidden(
          `This action requires one of these roles: ${allowedGroups.join(', ')}`,
          'INSUFFICIENT_ROLE',
        );
      }
    }
  };
}
