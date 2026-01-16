/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import { readdir } from 'fs/promises';
import { join } from 'path';

import { left, right, type Either } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';

type Locale = { locale: string };
type Response = Either<HTTPException, Locale[]>;

@Service()
export default class LocaleListUseCase {
  async execute(): Promise<Response> {
    try {
      const pathname = join(process.cwd(), '_locales');
      const files = await readdir(pathname);
      const locales = files.map((file) => ({ locale: file.split('.')[0] }));

      return right(locales);
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'LOCALES_READ_ERROR',
        ),
      );
    }
  }
}
