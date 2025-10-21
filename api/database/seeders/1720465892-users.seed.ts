import { Optional } from '@core/entity.core';
import { UserGroup } from '@model/user-group.model';
import { User } from '@model/user.model';
import bcrypt from 'bcryptjs';

type Payload = Optional<
  import('@core/entity.core').User,
  '_id' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt'
>;

export default async function Seed(): Promise<void> {
  await User.deleteMany({});

  const groups = await UserGroup.find();

  const masterGroup = groups.find((g) => g.slug === 'master');
  const administratorGroup = groups.find((g) => g.slug === 'administrator');
  const managerGroup = groups.find((g) => g.slug === 'manager');
  const registeredGroup = groups.find((g) => g.slug === 'registered');

  const password = await bcrypt.hash('10203040', 6);
  const payload: Payload[] = [
    {
      name: 'admin',
      group: masterGroup?._id?.toString() as string,
      email: 'admin@admin.com',
      password: await bcrypt.hash('admin', 6),
      status: 'active',
    },
    {
      name: 'master',
      group: masterGroup?._id?.toString() as string,
      email: 'master@lowcodejs.org',
      password,
      status: 'active',
    },
    {
      name: 'administrator',
      group: administratorGroup?._id?.toString() as string,
      email: 'administrator@lowcodejs.org',
      password,
      status: 'active',
    },
    {
      name: 'manager',
      group: managerGroup?._id?.toString() as string,
      email: 'manager@lowcodejs.org',
      password,
      status: 'active',
    },

    {
      name: ' registered',
      group: registeredGroup?._id?.toString() as string,
      email: 'registered@lowcodejs.org',
      password,
      status: 'active',
    },
  ];
  await User.insertMany(payload);

  console.info('🌱 \x1b[32m Users \x1b[0m');
}
