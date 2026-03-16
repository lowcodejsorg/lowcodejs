/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField as Entity, IField } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildSchema, buildTable } from '@application/core/util.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { GroupFieldCreatePayload } from './create.validator';

type Response = Either<HTTPException, Entity>;
type Payload = GroupFieldCreatePayload;

@Service()
export default class GroupFieldCreateUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly fieldRepository: FieldContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBy({
        slug: payload.slug,
        exact: true,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      const targetGroup = table.groups?.find(
        (g) => g.slug === payload.groupSlug,
      );
      if (!targetGroup) {
        return left(
          HTTPException.NotFound('Group not found', 'GROUP_NOT_FOUND'),
        );
      }

      const slug = slugify(payload.name, { lower: true, trim: true });

      // Verifica se o campo já existe no grupo
      const existFieldInGroup = targetGroup.fields?.find(
        (f) => f.slug === slug,
      );

      if (existFieldInGroup) {
        return left(
          HTTPException.Conflict(
            'Field already exist in group',
            'FIELD_ALREADY_EXIST',
          ),
        );
      }

      // Cria o campo
      const field = await this.fieldRepository.create({
        ...payload,
        slug,
        group: null,
      });

      // Atualiza o grupo com o novo campo e schema
      const updatedGroups = table.groups.map((g) => {
        if (g.slug !== targetGroup.slug) return g;

        const updatedFields = [...(g.fields || []), field];
        const groupSchema = buildSchema(updatedFields);

        return {
          ...g,
          fields: updatedFields,
          _schema: groupSchema,
        };
      });

      // Reconstrói o schema da tabela pai com os grupos atualizados
      const parentSchema = buildSchema(table.fields as IField[], updatedGroups);

      await this.tableRepository.update({
        _id: table._id,
        _schema: parentSchema,
        groups: updatedGroups,
        owner: table.owner._id,
        administrators: table.administrators.flatMap((a) => a._id),
      });

      await buildTable({
        ...table,
        _id: table._id,
        _schema: parentSchema,
        groups: updatedGroups,
      });

      return right(field);
    } catch (error) {
      console.error('Error creating group field:', error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'CREATE_GROUP_FIELD_ERROR',
        ),
      );
    }
  }
}
