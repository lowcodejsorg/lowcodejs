import type { FastifyRequest } from 'fastify';
import { getInstanceByToken } from 'fastify-decorators';
import z from 'zod';

import {
  E_TABLE_PERMISSION,
  type ITable,
  type ValueOf,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { Table as TableModel } from '@application/model/table.model';
import type { PermissionContractService } from '@application/services/permission/permission-contract.service';
import PermissionService from '@application/services/permission/permission.service';

const ParamsSchema = z.object({
  slug: z.string().trim().min(1).optional(),
});

interface AccessOptions {
  requiredPermission: ValueOf<typeof E_TABLE_PERMISSION>;
}

/**
 * Middleware de acesso a tabelas.
 * Parsing de request + delegacao para PermissionContractService.
 */
export function TableAccessMiddleware(options: AccessOptions) {
  const { requiredPermission } = options;

  return async function (request: FastifyRequest): Promise<void> {
    const permissionService =
      getInstanceByToken<PermissionContractService>(PermissionService);

    // 1. Validar parametro slug
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
        table = (await TableModel.findOne({
          slug,
        }).lean()) as unknown as ITable;

        if (!table) {
          throw HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND');
        }

        request.table = table;
      }
    }

    // 3. Verificar acesso publico (visitante sem auth)
    const accessInput = {
      table,
      userId: request.user?.sub,
      userRole: request.user?.role,
      requiredPermission,
      httpMethod: request.method,
    };

    if (permissionService.isPublicAccess(accessInput)) {
      return;
    }

    // 4. Verificar permissoes completas
    const result = await permissionService.checkTableAccess(accessInput);

    if (result.ownership) {
      request.ownership = result.ownership;
    }
  };
}
