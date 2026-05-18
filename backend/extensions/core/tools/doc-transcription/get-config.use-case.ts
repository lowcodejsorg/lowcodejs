import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';

import { getOrCreateConfig } from './doc-transcription-config.model';
import type { IDocTranscriptionConfig } from './doc-transcription.types';

type Response = Either<HTTPException, IDocTranscriptionConfig>;

@Service()
export default class GetDocTranscriptionConfigUseCase {
  async execute(): Promise<Response> {
    const config = await getOrCreateConfig();
    return right(config);
  }
}
