/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import { readFile } from 'fs/promises';
import { join } from 'path';

import { left, right, type Either } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';

import type { LocaleShowPayload } from './show.validator';

type Translations = Record<string, string | string[]>;
type Response = Either<HTTPException, Translations>;
type Payload = LocaleShowPayload;

@Service()
export default class LocaleShowUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const pathname = join(
        process.cwd(),
        '_locales',
        `${payload.locale}.properties`,
      );

      let file: string;
      try {
        file = await readFile(pathname, 'utf-8');
      } catch (_fileError) {
        return left(
          HTTPException.NotFound('Locale not found', 'LOCALE_NOT_FOUND'),
        );
      }

      const translations: Translations = {};

      for (const line of file.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            if (!value.includes(';')) {
              translations[key.trim()] = value;
            } else {
              translations[key.trim()] = value
                .split(';')
                .filter(Boolean)
                .map((v) => v.trim());
            }
          }
        }
      }

      return right(translations);
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'LOCALE_READ_ERROR',
        ),
      );
    }
  }
}
