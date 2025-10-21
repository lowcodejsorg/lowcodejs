import ValidateCodeRecoveryUseCase from '@use-case/authentication/recovery/validate-code.use-case';
import { AuthenticationRecoveryValidateCodeSchema } from '@validators/authentication.validator';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

@Controller({
  route: 'authentication',
})
export default class {
  constructor(
    private readonly useCase: ValidateCodeRecoveryUseCase = getInstanceByToken(
      ValidateCodeRecoveryUseCase,
    ),
  ) {}

  @POST({
    url: 'recovery/validate-code',
    options: {
      schema: {
        tags: ['Authentication'],
        summary: 'Validate password recovery code',
        description: 'Validates a password recovery code and returns a temporary token for password reset',
        body: {
          type: 'object',
          required: ['code'],
          properties: {
            code: {
              type: 'string',
              description: 'Recovery code received via email'
            }
          }
        },
        response: {
          200: {
            description: 'Code validated successfully',
            type: 'object',
            properties: {
              token: { type: 'string' },
              message: { type: 'string' }
            }
          },
          400: {
            description: 'Bad request - Invalid or expired code',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Invalid recovery code', 'Recovery code has expired'] },
              code: { type: 'number', enum: [400] },
              cause: { type: 'string', enum: ['INVALID_CODE', 'CODE_EXPIRED'] }
            },
            examples: [
              {
                message: 'Invalid recovery code',
                code: 400,
                cause: 'INVALID_CODE'
              },
              {
                message: 'Recovery code has expired',
                code: 400,
                cause: 'CODE_EXPIRED'
              }
            ]
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Internal server error'] },
              code: { type: 'number', enum: [500] },
              cause: { type: 'string', enum: ['INTERNAL_SERVER_ERROR'] }
            },
            examples: [
              {
                message: 'Internal server error',
                code: 500,
                cause: 'INTERNAL_SERVER_ERROR'
              }
            ]
          }
        }
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = AuthenticationRecoveryValidateCodeSchema.parse(request.body);

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
