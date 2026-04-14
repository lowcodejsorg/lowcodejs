import { E_ROLE } from '@application/core/entity.core';
import { Menu } from '@application/model/menu.model';
import { UserGroup } from '@application/model/user-group.model';

export default async function Seed(): Promise<void> {
  const registeredGroup = await UserGroup.findOne({
    slug: E_ROLE.REGISTERED,
  });

  if (!registeredGroup) {
    console.info(
      '🌱 \x1b[31m migrate-menu-visibility: grupo REGISTERED nao encontrado \x1b[0m',
    );
    return;
  }

  const registeredGroupId = registeredGroup._id.toString();

  const result = await Menu.updateMany(
    { visibility: { $exists: false } },
    { $set: { visibility: registeredGroupId } },
  );

  console.info(
    `🌱 \x1b[32m migrate-menu-visibility: ${result.modifiedCount} menus atualizados com visibilidade padrao (REGISTERED) \x1b[0m`,
  );
}
