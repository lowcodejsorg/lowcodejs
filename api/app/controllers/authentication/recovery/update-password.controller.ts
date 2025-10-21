import UpdatePasswordRecoveryUseCase from '@use-case/authentication/recovery/update-password.use-case';
import { AuthenticationRecoveryUpdatePasswordSchema } from '@validators/authentication.validator';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, PUT } from 'fastify-decorators';

@Controller({
  route: 'authentication',
})
export default class {
  constructor(
    private readonly useCase: UpdatePasswordRecoveryUseCase = getInstanceByToken(
      UpdatePasswordRecoveryUseCase,
    ),
  ) {}

  @PUT({
    url: 'recovery/update-password',
    options: {
      schema: {
        tags: ['Authentication'],
        summary: 'Update password after recovery',
        description:
          'Updates user password using a valid recovery token obtained from code validation',
        body: {
          type: 'object',
          required: ['password'],
          properties: {
            password: {
              type: 'string',
              minLength: 8,
              description: 'New password (minimum 8 characters)',
            },
          },
        },
        response: {
          200: {
            description: 'Password updated successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          400: {
            description:
              'Bad request - Invalid token or password validation error',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                enum: [
                  'Invalid recovery token',
                  'Password must be at least 8 characters',
                ],
              },
              code: { type: 'number', enum: [400] },
              cause: {
                type: 'string',
                enum: ['INVALID_TOKEN', 'INVALID_PARAMETERS'],
              },
            },
            examples: [
              {
                message: 'Invalid recovery token',
                code: 400,
                cause: 'INVALID_TOKEN',
              },
              {
                message: 'Password must be at least 8 characters',
                code: 400,
                cause: 'INVALID_PARAMETERS',
              },
            ],
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['INTERNAL_SERVER_ERROR'] },
            },
            examples: [
              {
                message: 'Internal server error',
                code: 500,
                cause: 'INTERNAL_SERVER_ERROR',
              },
            ],
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = AuthenticationRecoveryUpdatePasswordSchema.parse(request.body);

    // @ts-ignore
    const result = await this.useCase.execute(body);

    if (result.isLeft()) {
      const error = result.value;

      return response.status(error.code).send({
        message: error.message,
        code: error.code,
        cause: error.cause,
      });
    }

    return response.status(200).send(result.value);
  }
}
