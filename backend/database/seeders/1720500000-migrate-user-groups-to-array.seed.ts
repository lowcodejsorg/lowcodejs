import { User } from '@application/model/user.model';

export default async function Seed(): Promise<void> {
  const usersWithOldGroup = await User.find({
    group: { $exists: true, $ne: null },
  });

  if (usersWithOldGroup.length === 0) {
    console.info(
      '🌱 \x1b[33m migrate-user-groups: nenhum usuario com campo group antigo \x1b[0m',
    );
    return;
  }

  let migratedCount = 0;

  for (const user of usersWithOldGroup) {
    const raw: Record<string, unknown> = user.toObject();
    const oldGroup = raw.group;

    if (!oldGroup) continue;

    const existingGroups = raw.groups;

    if (Array.isArray(existingGroups) && existingGroups.length > 0) {
      continue;
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: { groups: [oldGroup] },
        $unset: { group: '' },
      },
    );

    migratedCount++;
  }

  console.info(
    `🌱 \x1b[32m migrate-user-groups: ${migratedCount} usuarios migrados (group -> groups) \x1b[0m`,
  );
}
