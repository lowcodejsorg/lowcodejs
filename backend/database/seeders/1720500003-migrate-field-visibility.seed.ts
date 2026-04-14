import { E_ROLE } from '@application/core/entity.core';
import { Field } from '@application/model/field.model';
import { UserGroup } from '@application/model/user-group.model';

export default async function Seed(): Promise<void> {
  const registeredGroup = await UserGroup.findOne({
    slug: E_ROLE.REGISTERED,
  });

  if (!registeredGroup) {
    console.info(
      '🌱 \x1b[31m migrate-field-visibility: grupo REGISTERED nao encontrado \x1b[0m',
    );
    return;
  }

  const registeredGroupId = registeredGroup._id.toString();

  const fields = await Field.find({
    showInList: { $exists: true },
    visibilityList: { $exists: false },
  });

  if (fields.length === 0) {
    console.info(
      '🌱 \x1b[33m migrate-field-visibility: nenhum campo para migrar \x1b[0m',
    );
    return;
  }

  let migratedCount = 0;

  for (const field of fields) {
    const raw: Record<string, unknown> = field.toObject();

    const visibilityList =
      raw.showInList === true ? registeredGroupId : 'HIDDEN';
    const visibilityForm =
      raw.showInForm === true ? registeredGroupId : 'HIDDEN';
    const visibilityDetail =
      raw.showInDetail === true ? registeredGroupId : 'HIDDEN';

    await Field.updateOne(
      { _id: field._id },
      {
        $set: {
          visibilityList,
          visibilityForm,
          visibilityDetail,
        },
        $unset: {
          showInList: '',
          showInForm: '',
          showInDetail: '',
          showInFilter: '',
        },
      },
    );

    migratedCount++;
  }

  console.info(
    `🌱 \x1b[32m migrate-field-visibility: ${migratedCount} campos migrados (showIn* -> visibility*) \x1b[0m`,
  );
}
