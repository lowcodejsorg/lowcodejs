/* eslint-disable no-unused-vars */
import { randomUUID } from 'crypto';
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  E_FIELD_TYPE,
  type ICategory,
  type IField,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TableFieldAddCategoryPayload } from './add-category.validator';

type Response = Either<
  HTTPException,
  {
    node: {
      id: string;
      label: string;
      parentId: string | null;
    };
    field: IField;
  }
>;

type Payload = TableFieldAddCategoryPayload;

function addCategoryNode(
  nodes: Array<ICategory>,
  parentId: string,
  newNode: ICategory,
): { updated: Array<ICategory>; inserted: boolean } {
  let inserted = false;

  const updated = nodes.map((node) => {
    if (node.id === parentId) {
      inserted = true;
      return {
        ...node,
        children: [...(node.children ?? []), newNode],
      };
    }

    if (node.children?.length) {
      const result = addCategoryNode(
        node.children as Array<ICategory>,
        parentId,
        newNode,
      );
      if (result.inserted) {
        inserted = true;
        return {
          ...node,
          children: result.updated,
        };
      }
    }

    return node;
  });

  return { updated, inserted };
}

@Service()
export default class TableFieldAddCategoryUseCase {
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

      const field = await this.fieldRepository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!field)
        return left(
          HTTPException.NotFound('Field not found', 'FIELD_NOT_FOUND'),
        );

      const inTable = table.fields.some((f) => f._id === field._id);
      if (!inTable)
        return left(
          HTTPException.NotFound('Field not found', 'FIELD_NOT_FOUND'),
        );

      if (field.type !== E_FIELD_TYPE.CATEGORY) {
        return left(
          HTTPException.BadRequest(
            'Field is not CATEGORY type',
            'INVALID_FIELD_TYPE',
          ),
        );
      }

      const newNode: ICategory = {
        id: randomUUID(),
        label: payload.label,
        children: [],
      };

      const existingCategories = Array.isArray(field.configuration.category)
        ? field.configuration.category
        : [];

      const parentId = payload.parentId ?? null;

      const { updated, inserted } =
        parentId === null
          ? {
              updated: [...existingCategories, newNode],
              inserted: true,
            }
          : addCategoryNode(
              existingCategories as Array<ICategory>,
              parentId,
              newNode,
            );

      if (!inserted) {
        return left(
          HTTPException.NotFound(
            'Parent category not found',
            'PARENT_CATEGORY_NOT_FOUND',
          ),
        );
      }

      const updatedField = await this.fieldRepository.update({
        _id: field._id,
        configuration: {
          ...field.configuration,
          category: updated,
        },
      });

      return right({
        node: {
          id: newNode.id,
          label: newNode.label,
          parentId,
        },
        field: updatedField,
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'ADD_CATEGORY_OPTION_ERROR',
        ),
      );
    }
  }
}
