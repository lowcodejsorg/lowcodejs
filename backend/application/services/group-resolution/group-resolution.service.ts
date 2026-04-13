import { Service } from 'fastify-decorators';

import {
  E_ROLE,
  type E_SYSTEM_PERMISSION,
  type IGroup,
  type IUser,
  type ValueOf,
} from '@application/core/entity.core';

import { GroupResolutionContractService } from './group-resolution-contract.service';

@Service()
export default class GroupResolutionService extends GroupResolutionContractService {
  resolveUserGroupIds(user: IUser): string[] {
    const groups = this.resolveUserGroups(user);
    return groups.map((g) => g._id.toString());
  }

  resolveUserGroups(user: IUser): IGroup[] {
    if (!user.groups || !Array.isArray(user.groups)) {
      return [];
    }

    const visited = new Set<string>();
    const resolved: IGroup[] = [];

    const walk = (groups: IGroup[]): void => {
      for (const group of groups) {
        const id = group._id.toString();

        if (visited.has(id)) {
          continue;
        }

        visited.add(id);
        resolved.push(group);

        if (group.encompasses && Array.isArray(group.encompasses)) {
          walk(group.encompasses);
        }
      }
    };

    walk(user.groups);
    return resolved;
  }

  userBelongsToGroup(user: IUser, targetGroupId: string): boolean {
    const groupIds = this.resolveUserGroupIds(user);
    return groupIds.includes(targetGroupId);
  }

  checkSystemPermission(
    user: IUser,
    permission: ValueOf<typeof E_SYSTEM_PERMISSION>,
  ): boolean {
    if (this.isMasterUser(user)) {
      return true;
    }

    const groups = this.resolveUserGroups(user);

    for (const group of groups) {
      if (group.systemPermissions && group.systemPermissions[permission]) {
        return true;
      }
    }

    return false;
  }

  isMasterUser(user: IUser): boolean {
    if (!user.groups || !Array.isArray(user.groups)) {
      return false;
    }

    return user.groups.some((g) => g.slug === E_ROLE.MASTER);
  }
}
