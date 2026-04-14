import { UserGroup } from '@application/model/user-group.model';
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
  const skipped: string[] = [];

  for (const user of usersWithOldGroup) {
    const raw: Record<string, unknown> = user.toObject();
    const oldGroup = raw.group;

    if (!oldGroup) continue;

    const existingGroups = raw.groups;
    if (Array.isArray(existingGroups) && existingGroups.length > 0) continue;

    const referencedGroup = await UserGroup.findById(oldGroup).lean();
    if (!referencedGroup) {
      skipped.push(user._id.toString());
      continue;
    }

    try {
      await User.updateOne({ _id: user._id }, { $set: { groups: [oldGroup] } });

      const verified = await User.findById(user._id).lean();
      if (
        !verified ||
        !Array.isArray(verified.groups) ||
        verified.groups.length === 0
      ) {
        skipped.push(user._id.toString());
        continue;
      }

      await User.updateOne({ _id: user._id }, { $unset: { group: '' } });
      migratedCount++;
    } catch (error) {
      skipped.push(user._id.toString());
      console.error(
        `🌱 \x1b[31m migrate-user-groups: falha em ${user._id} \x1b[0m`,
        error,
      );
    }
  }

  console.info(
    `🌱 \x1b[32m migrate-user-groups: ${migratedCount} usuarios migrados (group -> groups) \x1b[0m`,
  );

  if (skipped.length > 0) {
    console.warn(
      `🌱 \x1b[33m migrate-user-groups: ${skipped.length} pulados (grupo inexistente ou falha): ${skipped.join(', ')} \x1b[0m`,
    );
  }
}
