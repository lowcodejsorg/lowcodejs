import bcrypt from 'bcryptjs';

import { E_ROLE, E_USER_STATUS } from '@application/core/entity.core';
import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';

type BasePayload = Omit<
  import('@application/core/entity.core').IUser,
  '_id' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt' | 'groups'
>;

type Payload = BasePayload & {
  groups: string[];
};

export default async function Seed(): Promise<void> {
  const groups = await UserGroup.find();

  const masterGroup = groups.find((g) => g.slug === E_ROLE.MASTER);

  const administratorGroup = groups.find(
    (g) => g.slug === E_ROLE.ADMINISTRATOR,
  );
  const managerGroup = groups.find((g) => g.slug === E_ROLE.MANAGER);

  const registeredGroup = groups.find((g) => g.slug === E_ROLE.REGISTERED);

  const password = await bcrypt.hash('10203040', 6);

  console.info({ password });

  const payload: Payload[] = [
    {
      name: 'admin',
      groups: [administratorGroup?._id?.toString() || ''],
      email: 'admin@admin.com',
      password: await bcrypt.hash('admin', 6),
      status: E_USER_STATUS.ACTIVE,
    },
    {
      name: 'master',
      groups: [masterGroup?._id?.toString() || ''],
      email: 'master@lowcodejs.org',
      password,
      status: E_USER_STATUS.ACTIVE,
    },
    {
      name: 'administrator',
      groups: [administratorGroup?._id?.toString() || ''],
      email: 'administrator@lowcodejs.org',
      password,
      status: E_USER_STATUS.ACTIVE,
    },
    {
      name: 'manager',
      groups: [managerGroup?._id?.toString() || ''],
      email: 'manager@lowcodejs.org',
      password,
      status: E_USER_STATUS.ACTIVE,
    },

    {
      name: 'registered',
      groups: [registeredGroup?._id?.toString() || ''],
      email: 'registered@lowcodejs.org',
      password,
      status: E_USER_STATUS.ACTIVE,
    },
  ];

  for (const { email, ...rest } of payload) {
    await User.updateOne(
      { email },
      { $set: { email, ...rest } },
      { upsert: true },
    );
  }

  console.info('🌱 \x1b[32m Users \x1b[0m');
}
