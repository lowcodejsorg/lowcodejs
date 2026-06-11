import {
  FIELD_GROUP_NATIVE_LIST,
  type IField,
} from '@application/core/entity.core';
import type { FieldContractRepository } from '@application/repositories/field/field-contract.repository';

export async function createGroupNativeFields(
  fieldRepository: FieldContractRepository,
  groupSlug: string,
): Promise<IField[]> {
  const payloads = FIELD_GROUP_NATIVE_LIST.map((f) => ({
    ...f,
    group: { slug: groupSlug },
  }));
  return fieldRepository.createMany(payloads);
}
