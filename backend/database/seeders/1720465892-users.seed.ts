import bcrypt from 'bcryptjs';

import { E_ROLE, E_USER_STATUS } from '@application/core/entity.core';
import { UserGroup } from '@application/model/user-group.model';
import { User } from '@application/model/user.model';

type BasePayload = Omit<
  import('@application/core/entity.core').IUser,
  '_id' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt' | 'group'
>;

type Payload = BasePayload & {
  group: string;
};

export default async function Seed(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.info(
      '⏭️  \x1b[33m Users seed ignorado em produção (MASTER criado pelo wizard) \x1b[0m',
    );
    return;
  }

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
      group: administratorGroup?._id?.toString() as string,
      email: 'admin@admin.com',
      password: await bcrypt.hash('admin', 6),
      status: E_USER_STATUS.ACTIVE,
    },
    {
      name: 'master',
      group: masterGroup?._id?.toString() as string,
      email: 'master@lowcodejs.org',
      password,
      status: E_USER_STATUS.ACTIVE,
    },
    {
      name: 'administrator',
      group: administratorGroup?._id?.toString() as string,
      email: 'administrator@lowcodejs.org',
      password,
      status: E_USER_STATUS.ACTIVE,
    },
    {
      name: 'manager',
      group: managerGroup?._id?.toString() as string,
      email: 'manager@lowcodejs.org',
      password,
      status: E_USER_STATUS.ACTIVE,
    },

    {
      name: ' registered',
      group: registeredGroup?._id?.toString() as string,
      email: 'registered@lowcodejs.org',
      password,
      status: E_USER_STATUS.ACTIVE,
    },
  ];

  // await User.insertMany(payload);

  await User.bulkWrite(
    payload.map(({ email, ...rest }) => ({
      updateOne: {
        filter: { email },
        update: { $set: { email, ...rest } as any },
        upsert: true,
      },
    })),
  );
  console.info('🌱 \x1b[32m Users \x1b[0m');
}
