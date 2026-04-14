/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  E_FIELD_TYPE,
  type IField as Entity,
  type IField,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
import { normalizeDefaultValue } from '@application/resources/table-fields/table-field-base.schema';
import { TableSchemaContractService } from '@application/services/table-schema/table-schema-contract.service';

import type { GroupFieldCreatePayload } from './create.validator';

type Response = Either<HTTPException, Entity>;
type Payload = GroupFieldCreatePayload;

@Service()
export default class GroupFieldCreateUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly fieldRepository: FieldContractRepository,
    private readonly tableSchemaService: TableSchemaContractService,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table)
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );

      const targetGroup = table.groups?.find(
        (g) => g.slug === payload.groupSlug,
      );
      if (!targetGroup) {
        return left(
          HTTPException.NotFound('Grupo não encontrado', 'GROUP_NOT_FOUND'),
        );
      }

      // Verifica se o campo FIELD_GROUP pai está na lixeira
      const parentField = table.fields.find(
        (f) =>
          f.type === E_FIELD_TYPE.FIELD_GROUP &&
          f.group?.slug === payload.groupSlug,
      );
      if (parentField?.trashed) {
        return left(
          HTTPException.Forbidden(
            'Não é possível criar campos em um grupo na lixeira',
            'GROUP_IS_TRASHED',
          ),
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
            'Campo já existe no grupo',
            'FIELD_ALREADY_EXIST',
            { name: 'Campo já existe no grupo' },
          ),
        );
      }

      // Cria o campo
      const field = await this.fieldRepository.create({
        ...payload,
        defaultValue: normalizeDefaultValue(payload.type, payload.defaultValue),
        slug,
        group: null,
      });

      // Atualiza o grupo com o novo campo e schema
      const updatedGroups = table.groups.map((g) => {
        if (g.slug !== targetGroup.slug) return g;

        const updatedFields = [...(g.fields || []), field];
        const groupSchema =
          this.tableSchemaService.computeSchema(updatedFields);

        return {
          ...g,
          fields: updatedFields,
          _schema: groupSchema,
        };
      });

      // Reconstrói o schema da tabela pai com os grupos atualizados
      const parentSchema = this.tableSchemaService.computeSchema(
        table.fields,
        updatedGroups,
      );

      await this.tableRepository.update({
        _id: table._id,
        _schema: parentSchema,
        groups: updatedGroups,
        owner: table.owner._id,
      });

      await this.tableSchemaService.syncModel({
        ...table,
        _id: table._id,
        _schema: parentSchema,
        groups: updatedGroups,
      });

      return right(field);
    } catch (error) {
      console.error('[group-fields > create][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'CREATE_GROUP_FIELD_ERROR',
        ),
      );
    }
  }
}
