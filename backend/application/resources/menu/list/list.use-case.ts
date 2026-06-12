/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type {
  IMenu as Entity,
  IPermissionBinding,
  IUser,
} from '@application/core/entity.core';
import { E_PERMISSION_TARGET, E_ROLE } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { MenuContractRepository } from '@application/repositories/menu/menu-contract.repository';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import { GroupResolverContractService } from '@application/services/group-resolver/group-resolver-contract.service';

type Response = Either<HTTPException, Entity[]>;

type Payload = {
  actorUserId?: string;
  role?: string;
};

@Service()
export default class MenuListUseCase {
  constructor(
    private readonly menuRepository: MenuContractRepository,
    private readonly userRepository: UserContractRepository,
    private readonly groupResolver: GroupResolverContractService,
  ) {}

  // Binding ausente (menu legado) = visível. PUBLIC visível, NOBODY oculto,
  // GROUP visível só para quem está no grupo (fecho transitivo).
  private bindingAllows(
    visibility: IPermissionBinding | null | undefined,
    userGroupIds: Set<string>,
  ): boolean {
    if (!visibility) return true;
    if (visibility.kind === E_PERMISSION_TARGET.PUBLIC) return true;
    if (visibility.kind === E_PERMISSION_TARGET.NOBODY) return false;
    if (!visibility.group) return false;
    return userGroupIds.has(String(visibility.group));
  }

  // Visível só se o próprio e todos os ancestrais forem visíveis
  // ("pai oculto esconde a subárvore"). Espelha o filtro do frontend.
  private isVisible(
    menu: Entity,
    byId: Map<string, Entity>,
    userGroupIds: Set<string>,
  ): boolean {
    const guard = new Set<string>();
    let current: Entity | undefined = menu;

    while (current) {
      const currentId = String(current._id);
      if (guard.has(currentId)) break;
      guard.add(currentId);

      if (!this.bindingAllows(current.visibility, userGroupIds)) return false;

      if (!current.parent) break;
      current = byId.get(String(current.parent));
    }

    return true;
  }

  async execute(payload: Payload = {}): Promise<Response> {
    try {
      const menus = await this.menuRepository.findMany({
        trashed: false,
        sort: { order: 'asc', name: 'asc' },
      });

      // MASTER/ADMINISTRATOR enxergam todos os menus.
      if (
        payload.role === E_ROLE.MASTER ||
        payload.role === E_ROLE.ADMINISTRATOR
      ) {
        return right(menus);
      }

      let user: IUser | null = null;
      if (payload.actorUserId) {
        user = await this.userRepository.findById(payload.actorUserId);
      }
      const userGroupIds = await this.groupResolver.resolveUserGroupIds(user);

      const byId = new Map<string, Entity>();
      for (const menu of menus) byId.set(String(menu._id), menu);

      const visible = menus.filter((menu) =>
        this.isVisible(menu, byId, userGroupIds),
      );

      return right(visible);
    } catch (error) {
      console.error('[menu > list][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'LIST_MENU_ERROR',
        ),
      );
    }
  }
}
