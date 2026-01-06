/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { Menu as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { MenuContractRepository } from '@application/repositories/menu/menu-contract.repository';

import type { MenuShowParamValidator } from './show.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof MenuShowParamValidator>;

@Service()
export default class MenuShowUseCase {
  constructor(private readonly menuRepository: MenuContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const menu = await this.menuRepository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!menu)
        return left(HTTPException.NotFound('Menu not found', 'MENU_NOT_FOUND'));

      const children = await this.menuRepository.findMany({
        parent: payload._id,
        trashed: false,
      });

      return right({
        ...menu,
        children: children.map((child) => ({
          _id: child._id,
          name: child.name,
          type: child.type,
          slug: child.slug,
        })),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'GET_MENU_BY_ID_ERROR',
        ),
      );
    }
  }
}
