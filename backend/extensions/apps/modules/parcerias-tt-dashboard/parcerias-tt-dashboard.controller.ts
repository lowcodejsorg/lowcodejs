/* eslint-disable no-unused-vars */
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';

import { E_EXTENSION_TYPE, E_ROLE } from '@application/core/entity.core';
import { AuthenticationMiddleware } from '@application/middlewares/authentication.middleware';
import { ExtensionActiveMiddleware } from '@application/middlewares/extension-active.middleware';
import { RoleMiddleware } from '@application/middlewares/role.middleware';

import {
  ParceriasTtDashboardRowsSchema,
  ParceriasTtDashboardSchema,
} from './parcerias-tt-dashboard.schema';
import ParceriasTtDashboardUseCase from './parcerias-tt-dashboard.use-case';
import {
  ParceriasTtDashboardQueryValidator,
  ParceriasTtDashboardRowsQueryValidator,
} from './parcerias-tt-dashboard.validator';

@Controller({
  route: '/e/apps/parcerias-tt-dashboard',
})
export default class {
  constructor(
    private readonly useCase: ParceriasTtDashboardUseCase = getInstanceByToken(
      ParceriasTtDashboardUseCase,
    ),
  ) {}

  @GET({
    url: '/stats',
    options: {
      onRequest: [
        AuthenticationMiddleware({ optional: false }),
        RoleMiddleware([E_ROLE.MASTER, E_ROLE.ADMINISTRATOR]),
        ExtensionActiveMiddleware({
          pkg: 'apps',
          type: E_EXTENSION_TYPE.MODULE,
          extensionId: 'parcerias-tt-dashboard',
        }),
      ],
      schema: ParceriasTtDashboardSchema,
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const query = ParceriasTtDashboardQueryValidator.parse(request.query);
    const result = await this.useCase.execute(query);

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
        ...(error.errors && { errors: error.errors }),
      });
    }

    return response.status(200).send(result.value);
  }

  @GET({
    url: '/rows',
    options: {
      onRequest: [
        AuthenticationMiddleware({ optional: false }),
        RoleMiddleware([E_ROLE.MASTER, E_ROLE.ADMINISTRATOR]),
        ExtensionActiveMiddleware({
          pkg: 'apps',
          type: E_EXTENSION_TYPE.MODULE,
          extensionId: 'parcerias-tt-dashboard',
        }),
      ],
      schema: ParceriasTtDashboardRowsSchema,
    },
  })
  async rows(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const query = ParceriasTtDashboardRowsQueryValidator.parse(request.query);
    const result = await this.useCase.rows(query);

    if (result.isLeft()) {
      const error = result.value;
      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
        ...(error.errors && { errors: error.errors }),
      });
    }

    return response.status(200).send(result.value);
  }
}
