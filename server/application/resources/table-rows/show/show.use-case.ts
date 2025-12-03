import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { Table } from '@application/model/table.model';

import type { TableRowShowParamValidator } from './show.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').Row
>;

@Service()
export default class TableRowShowUseCase {
  async execute(
    payload: z.infer<typeof TableRowShowParamValidator>,
  ): Promise<Response> {
    try {
      const table = await Table.findOne({
        slug: payload.slug,
      }).populate([
        {
          path: 'fields',
          model: 'Field',
        },
      ]);

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      const c = await buildTable({
        ...table?.toJSON({
          flattenObjectIds: true,
        }),
        _id: table?._id.toString(),
      });

      const populate = await buildPopulate(
        table.fields as import('@application/core/entity.core').Field[],
      );

      const row = await c.findOne({
        _id: payload._id,
      });

      if (!row)
        return left(HTTPException.NotFound('Row not found', 'ROW_NOT_FOUND'));

      const populated = await row.populate(populate);

      // Executar script onLoad se existir
      if (table?.methods?.onLoad?.code) {
        try {
          const { HandlerFunction } = await import('@application/core/util.core');
          const rowData = populated?.toJSON({
            flattenObjectIds: true,
          });

          const result = HandlerFunction(
            table.methods.onLoad.code,
            rowData,
            table.slug.toLowerCase(),
            table.fields.map((f: any) => f.slug),
            {
              userAction: 'editar_registro',
              executionMoment: 'carregamento_formulario',
              tableId: table._id?.toString(),
              userId: '', // TODO: Pegar userId do contexto da requisição
            },
          );

          if (!result.success) {
            console.error('Erro no onLoad (não bloqueante):', result.error);
          }

          // Retornar dados possivelmente modificados pelo script
          return right({
            ...rowData,
            _id: populated?._id?.toString(),
          });
        } catch (error) {
          console.error('Erro ao executar onLoad:', error);
        }
      }

      return right({
        ...populated?.toJSON({
          flattenObjectIds: true,
        }),
        _id: populated?._id?.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'GET_ROW_TABLE_BY_ID_ERROR',
        ),
      );
    }
  }
}
