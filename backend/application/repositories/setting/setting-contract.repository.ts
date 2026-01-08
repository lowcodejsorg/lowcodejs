/* eslint-disable no-unused-vars */
import type { ISetting } from '@application/core/entity.core';

export type SettingUpdatePayload = Partial<ISetting>;

export abstract class SettingContractRepository {
  abstract get(): Promise<ISetting | null>;
  abstract update(payload: SettingUpdatePayload): Promise<ISetting>;
}
