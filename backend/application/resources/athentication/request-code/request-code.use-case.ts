import { Service } from 'fastify-decorators';
import type z from 'zod';

import { left, right, type Either } from '@application/core/either.core';
import { TOKEN_STATUS } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { User as Model } from '@application/model/user.model';
import { ValidationToken } from '@application/model/validation-token.model';

import type { RequestCodeBodyValidator } from './request-code.validator';

type Response = Either<HTTPException, null>;
type Payload = z.infer<typeof RequestCodeBodyValidator>;
@Service()
export default class RequestCodeUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const user = await Model.findOne({ email: payload.email });

      if (!user)
        return left(
          HTTPException.NotFound('Email not found', 'EMAIL_NOT_FOUND'),
        );

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      await ValidationToken.create({
        code,
        status: TOKEN_STATUS.REQUESTED,
        user: user._id.toString(),
      });

      // enviar e-mail

      return right(null);
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'REQUEST_CODE_ERROR',
        ),
      );
    }
  }
}
