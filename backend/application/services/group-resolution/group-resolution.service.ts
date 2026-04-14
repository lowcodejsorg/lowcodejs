import { Inject, Service } from 'fastify-decorators';

import {
  E_ROLE,
  type E_SYSTEM_PERMISSION,
  type IGroup,
  type IUser,
  type ValueOf,
} from '@application/core/entity.core';
import { UserGroupContractRepository } from '@application/repositories/user-group/user-group-contract.repository';

import { GroupResolutionContractService } from './group-resolution-contract.service';

type GroupRef = IGroup | string | { _id?: unknown } | null | undefined;

function extractId(ref: GroupRef): string | null {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  if (typeof ref !== 'object') return null;
  const id = (ref as { _id?: unknown })._id;
  if (id === null || id === undefined) return null;
  return String(id);
}

function isFullGroup(ref: GroupRef): ref is IGroup {
  return (
    !!ref &&
    typeof ref === 'object' &&
    'slug' in ref &&
    'permissions' in ref
  );
}

@Service()
export default class GroupResolutionService extends GroupResolutionContractService {
  @Inject(UserGroupContractRepository)
  private readonly userGroupRepository!: UserGroupContractRepository;

  async resolveUserGroupIds(user: IUser): Promise<string[]> {
    const groups = await this.resolveUserGroups(user);
    return groups.map((g) => String(g._id));
  }

  async resolveUserGroups(user: IUser): Promise<IGroup[]> {
    if (!Array.isArray(user.groups) || user.groups.length === 0) {
      return [];
    }

    const resolved = new Map<string, IGroup>();
    const queue: string[] = [];

    const seed = (ref: GroupRef): void => {
      const id = extractId(ref);
      if (!id || resolved.has(id)) return;
      if (isFullGroup(ref)) {
        resolved.set(id, ref);
        for (const child of (ref.encompasses ?? []) as GroupRef[]) {
          seed(child);
        }
        return;
      }
      if (!queue.includes(id)) queue.push(id);
    };

    for (const ref of user.groups as GroupRef[]) {
      seed(ref);
    }

    while (queue.length > 0) {
      const id = queue.shift() as string;
      if (resolved.has(id)) continue;
      const group = await this.userGroupRepository.findById(id);
      if (!group) continue;
      resolved.set(String(group._id), group);
      for (const child of (group.encompasses ?? []) as GroupRef[]) {
        seed(child);
      }
    }

    return Array.from(resolved.values());
  }

  async userBelongsToGroup(
    user: IUser,
    targetGroupId: string,
  ): Promise<boolean> {
    const groupIds = await this.resolveUserGroupIds(user);
    return groupIds.includes(targetGroupId);
  }

  async checkSystemPermission(
    user: IUser,
    permission: ValueOf<typeof E_SYSTEM_PERMISSION>,
  ): Promise<boolean> {
    if (this.isMasterUser(user)) {
      return true;
    }

    const groups = await this.resolveUserGroups(user);

    for (const group of groups) {
      if (group.systemPermissions && group.systemPermissions[permission]) {
        return true;
      }
    }

    return false;
  }

  isMasterUser(user: IUser): boolean {
    if (!Array.isArray(user.groups)) return false;
    return (user.groups as GroupRef[]).some(
      (ref) => isFullGroup(ref) && ref.slug === E_ROLE.MASTER,
    );
  }
}
