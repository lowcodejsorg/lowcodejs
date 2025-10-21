import { Either, left, right } from '@core/either.core';
import ApplicationException from '@exceptions/application.exception';
import { Storage as Model } from '@model/storage.model';
import StorageService from '@services/storage.service';
import { getInstanceByToken, Service } from 'fastify-decorators';

type Response = Either<ApplicationException, null>;

@Service()
export default class DeleteStorageUseCase {
  constructor(
    private readonly service: StorageService = getInstanceByToken(
      StorageService,
    ),
  ) {}

  async execute({ _id }: { _id: string }): Promise<Response> {
    try {
      const storage = await Model.findByIdAndDelete({ _id });

      if (!storage) {
        return left(
          ApplicationException.NotFound(
            'Storage not found',
            'STORAGE_NOT_FOUND',
          ),
        );
      }

      await this.service.delete(storage.filename);

      return right(null);
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'STORAGE_DELETE_ERROR',
        ),
      );
    }
  }
}
