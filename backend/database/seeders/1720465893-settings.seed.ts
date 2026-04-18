import { E_ROLE } from '@application/core/entity.core';
import { Setting } from '@application/model/setting.model';
import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';

export default async function Seed(): Promise<void> {
  const masterGroup = await UserGroup.findOne({ slug: E_ROLE.MASTER });

  let hasMaster = false;

  if (masterGroup) {
    const exists = await User.exists({
      group: masterGroup._id,
      trashed: false,
    });
    hasMaster = Boolean(exists);
  }

  if (hasMaster) {
    await Setting.findOneAndUpdate(
      {},
      { $set: { SETUP_COMPLETED: true, SETUP_CURRENT_STEP: null } },
      { upsert: true, setDefaultsOnInsert: true, new: true },
    );
    console.info(
      '🌱 \x1b[32m Setting (singleton) \x1b[0m — SETUP_COMPLETED=true (MASTER existente)',
    );
    return;
  }

  await Setting.findOneAndUpdate(
    {},
    { $setOnInsert: {} },
    { upsert: true, setDefaultsOnInsert: true, new: true },
  );
  console.info('🌱 \x1b[32m Setting (singleton) \x1b[0m');
}
