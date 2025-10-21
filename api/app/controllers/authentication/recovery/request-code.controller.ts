import RequestCodeRecoveryUseCase from '@use-case/authentication/recovery/request-code';
import { AuthenticationRecoveryRequestCodeSchema } from '@validators/authentication.validator';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';

@Controller({
  route: 'authentication',
})
export default class {
  constructor(
    private readonly useCase: RequestCodeRecoveryUseCase = getInstanceByToken(
      RequestCodeRecoveryUseCase,
    ),
  ) {}

  @POST({
    url: 'recovery/request-code',
    options: {
      schema: {
        tags: ['Authentication'],
        summary: 'Request password recovery code',
        description:
          'Sends a password recovery code to the specified email address',
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address to send recovery code to',
            },
          },
        },
        response: {
          200: {
            description: 'Recovery code sent successfully',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          400: {
            description: 'Bad request - Invalid email or validation error',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Invalid email format'] },
              code: { type: 'number', enum: [400] },
              cause: { type: 'string', enum: ['INVALID_PARAMETERS'] },
            },
            examples: [
              {
                message: 'Invalid email format',
                code: 400,
                cause: 'INVALID_PARAMETERS'
              }
            ]
          },
          404: {
            description: 'Email not found',
            type: 'object',
            properties: {
              message: { type: 'string', enum: ['Email not found'] },
              code: { type: 'number', enum: [404] },
              cause: { type: 'string', enum: ['EMAIL_NOT_FOUND'] },
            },
            examples: [
              {
                message: 'Email not found',
                code: 404,
                cause: 'EMAIL_NOT_FOUND'
              }
            ]
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
                cause: 'INTERNAL_SERVER_ERROR'
              }
            ]
          },
        },
      },
    },
  })
  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const body = AuthenticationRecoveryRequestCodeSchema.parse(request.body);

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
