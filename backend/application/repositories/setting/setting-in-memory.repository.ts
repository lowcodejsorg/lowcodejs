import type { ISetting } from '@application/core/entity.core';

import type {
  SettingContractRepository,
  SettingUpdatePayload,
} from './setting-contract.repository';

export default class SettingInMemoryRepository implements SettingContractRepository {
  private item: ISetting | null = null;

  async get(): Promise<ISetting | null> {
    return this.item;
  }

  async update(payload: SettingUpdatePayload): Promise<ISetting> {
    if (!this.item) {
      this.item = {
        LOCALE: 'pt-br',
        FILE_UPLOAD_MAX_SIZE: 10485760,
        FILE_UPLOAD_ACCEPTED: 'jpg;jpeg;png;pdf',
        FILE_UPLOAD_MAX_FILES_PER_UPLOAD: 10,
        PAGINATION_PER_PAGE: 20,
        MODEL_CLONE_TABLES: '',
        EMAIL_PROVIDER_HOST: '',
        EMAIL_PROVIDER_PORT: 587,
        EMAIL_PROVIDER_USER: '',
        ...payload,
      };
    } else {
      Object.assign(this.item, payload);
    }
    return this.item;
  }
}
