/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { IField, IUser } from '@application/core/entity.core';
import { E_PERMISSION_TARGET, E_ROLE } from '@application/core/entity.core';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import { GroupResolverContractService } from '@application/services/group-resolver/group-resolver-contract.service';

import type {
  FieldVisibilityContext,
  FieldVisibilityInput,
} from './field-visibility-contract.service';
import { FieldVisibilityContractService } from './field-visibility-contract.service';

@Service()
export default class FieldVisibilityService implements FieldVisibilityContractService {
  constructor(
    private readonly userRepository: UserContractRepository,
    private readonly groupResolver: GroupResolverContractService,
  ) {}

  async hiddenSlugs(input: FieldVisibilityInput): Promise<Set<string>> {
    const hidden = new Set<string>();

    if (this.isPrivileged(input)) return hidden;

    // Campos nativos (_id, creator, createdAt, trashed...) nunca sao ocultados:
    // sao estruturais.
    const candidates: IField[] = [];
    for (const field of input.fields) {
      if (!field.native) candidates.push(field);
    }

    if (candidates.length === 0) return hidden;

    // So resolve o fecho de grupos quando algum binding do contexto e GROUP.
    let groupIds = new Set<string>();
    if (this.needsGroupResolution(candidates, input.context)) {
      groupIds = await this.resolveGroupIds(input.userId);
    }

    for (const field of candidates) {
      if (!this.isFieldVisible(field, input.context, groupIds)) {
        hidden.add(field.slug);
      }
    }

    return hidden;
  }

  project<T extends Record<string, unknown>>(
    target: T,
    hidden: Set<string>,
  ): T {
    if (hidden.size === 0) return target;

    for (const slug of hidden) {
      if (slug in target) delete target[slug];
    }

    return target;
  }

  private isPrivileged(input: FieldVisibilityInput): boolean {
    if (
      input.userRole === E_ROLE.MASTER ||
      input.userRole === E_ROLE.ADMINISTRATOR
    ) {
      return true;
    }

    return Boolean(input.isOwner || input.isAdministrator);
  }

  private needsGroupResolution(
    fields: IField[],
    context: FieldVisibilityContext,
  ): boolean {
    for (const field of fields) {
      if (field.permissions?.[context]?.kind === E_PERMISSION_TARGET.GROUP) {
        return true;
      }
    }

    return false;
  }

  private async resolveGroupIds(userId?: string | null): Promise<Set<string>> {
    let user: IUser | null = null;
    if (userId) {
      user = await this.userRepository.findById(userId);
    }

    return this.groupResolver.resolveUserGroupIds(user);
  }

  private isFieldVisible(
    field: IField,
    context: FieldVisibilityContext,
    groupIds: Set<string>,
  ): boolean {
    const binding = field.permissions?.[context];

    // Sem binding: campo visivel (convencao do modelo novo, espelha o
    // userSatisfiesBinding do frontend).
    if (!binding) return true;

    if (binding.kind === E_PERMISSION_TARGET.PUBLIC) return true;
    if (binding.kind === E_PERMISSION_TARGET.NOBODY) return false;

    // GROUP: visivel se o grupo estiver no fecho do usuario.
    if (!binding.group) return false;

    return groupIds.has(binding.group);
  }
}
