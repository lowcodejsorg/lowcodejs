import type { ISetting } from '@application/core/entity.core';

import type {
  SettingContractRepository,
  SettingUpdatePayload,
} from './setting-contract.repository';

export default class SettingInMemoryRepository implements SettingContractRepository {
  private item: ISetting | null = null;
  private _forcedErrors = new Map<string, Error>();

  simulateError(method: string, error: Error): void {
    this._forcedErrors.set(method, error);
  }

  private _checkError(method: string): void {
    const err = this._forcedErrors.get(method);
    if (err) {
      this._forcedErrors.delete(method);
      throw err;
    }
  }

  async get(): Promise<ISetting | null> {
    this._checkError('get');
    return this.item;
  }

  async update(payload: SettingUpdatePayload): Promise<ISetting> {
    this._checkError('update');
    if (!this.item) {
      this.item = {
        LOCALE: 'pt-br',
        FILE_UPLOAD_MAX_SIZE: 10485760,
        FILE_UPLOAD_ACCEPTED: 'jpg;jpeg;png;pdf',
        FILE_UPLOAD_MAX_FILES_PER_UPLOAD: 10,
        PAGINATION_PER_PAGE: 20,
        MODEL_CLONE_TABLES: [],
        EMAIL_PROVIDER_HOST: null,
        EMAIL_PROVIDER_PORT: null,
        EMAIL_PROVIDER_USER: null,
        EMAIL_PROVIDER_PASSWORD: null,
        EMAIL_PROVIDER_FROM: null,
        AI_ASSISTANT_ENABLED: false,
        ...payload,
      } as unknown as ISetting;
    } else {
      Object.assign(this.item, payload);
    }
    return this.item!;
  }
}
