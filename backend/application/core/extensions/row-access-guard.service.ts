/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { IRow, ITable } from '@application/core/entity.core';
import { E_ROLE } from '@application/core/entity.core';
import { ExtensionContractRepository } from '@application/repositories/extension/extension-contract.repository';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import { GroupResolverContractService } from '@application/services/group-resolver/group-resolver-contract.service';

import { RowAccessControlGuard } from '../../../extensions/core/plugins/row-access/guard';

import type {
  GuardEvalContext,
  GuardWriteDecision,
  RowAccessGuard,
} from './row-access-guard.contract';

const GUARDS: Record<string, RowAccessGuard> = {};

@Service()
export class RowAccessGuardService {
  constructor(
    private readonly extensionRepository: ExtensionContractRepository,
    private readonly userRepository: UserContractRepository,
    private readonly groupResolver: GroupResolverContractService,
  ) {}

  static register(key: string, guard: RowAccessGuard): void {
    GUARDS[key] = guard;
  }

  static getRegistered(): Record<string, RowAccessGuard> {
    return GUARDS;
  }

  // ── Context resolution ─────────────────────────────────────────────────────

  /**
   * Resolve o GuardEvalContext para um userId dado.
   * Se userId for undefined (visitante), retorna contexto vazio sem privilégio.
   */
  async resolveContext(userId: string | undefined): Promise<GuardEvalContext> {
    if (!userId) {
      return {
        user: undefined,
        userId: undefined,
        groupIds: new Set<string>(),
        isPrivileged: false,
      };
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      return {
        user: undefined,
        userId,
        groupIds: new Set<string>(),
        isPrivileged: false,
      };
    }

    const groupIds = await this.groupResolver.resolveUserGroupIds(user);
    const isPrivileged = await this.groupResolver.isPrivileged(user);

    return {
      user: {
        sub: user._id,
        email: user.email,
        // user.group é o grupo principal (legacy compat para JWT). Pode ser
        // string ou objeto — extraímos o slug ou usamos REGISTERED como fallback.
        role: (typeof user.group === 'string'
          ? user.group
          : E_ROLE.REGISTERED) as import('@application/core/entity.core').ValueOf<
          typeof E_ROLE
        >,
        type: 'ACCESS',
      },
      userId,
      groupIds,
      isPrivileged,
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private async getActiveGuardsWithSettings(
    tableId: string,
  ): Promise<
    Array<{ guard: RowAccessGuard; settings: Record<string, unknown> }>
  > {
    const extensions =
      await this.extensionRepository.findActiveForTable(tableId);
    const result: Array<{
      guard: RowAccessGuard;
      settings: Record<string, unknown>;
    }> = [];
    for (const ext of extensions) {
      const guard = GUARDS[`${ext.pkg}:${ext.extensionId}`];
      if (!guard) continue;
      // tableSettings é um Record<tableId, settings> armazenado no campo Mixed
      const tableSettings = (ext as Record<string, unknown>)['tableSettings'];
      const settings: Record<string, unknown> =
        tableSettings &&
        typeof tableSettings === 'object' &&
        !Array.isArray(tableSettings)
          ? (((tableSettings as Record<string, unknown>)[tableId] as Record<
              string,
              unknown
            >) ?? {})
          : {};
      // Guard sem suporte a scope-all NÃO enforça via binding mode='all'
      // (ex.: core:row-access auto-ativado no boot com o default 'all' porém
      // nunca vinculado a uma tabela). Só enforça quando vinculado
      // explicitamente via tableScope.mode='specific' (feito pelo bulk-configure).
      const tableScope = (ext as Record<string, unknown>)['tableScope'] as
        | { mode?: string }
        | undefined;
      if (!guard.supportsScopeAll && tableScope?.mode === 'all') continue;
      result.push({ guard, settings });
    }
    return result;
  }

  // ── Compose helpers ─────────────────────────────────────────────────────────

  /**
   * Compõe a query Mongo com todos os guards ativos.
   * Bypass de privilegiado: retorna baseQuery inalterada.
   * Restrictive guards contribuem fragmentos AND.
   * Permissive guards contribuem escapes OR.
   */
  async composeListQuery(
    tableId: string,
    baseQuery: Record<string, unknown>,
    ctx: GuardEvalContext,
    table: ITable,
  ): Promise<Record<string, unknown>> {
    if (ctx.isPrivileged) return baseQuery;
    const active = await this.getActiveGuardsWithSettings(tableId);
    if (!active.length) return baseQuery;

    const restrictive: Record<string, unknown>[] = [];
    const permissive: Record<string, unknown>[] = [];

    for (const { guard, settings } of active) {
      const frag = guard.adjustListQuery({}, ctx, table, settings);
      if (Object.keys(frag).length === 0) continue; // sentinel: guard não tem nada a contribuir
      if (guard.category === 'restrictive') {
        restrictive.push(frag);
      } else {
        permissive.push(frag);
      }
    }

    const restrictedQuery: Record<string, unknown> = restrictive.length
      ? {
          ...baseQuery,
          $and: [...((baseQuery.$and as unknown[]) ?? []), ...restrictive],
        }
      : baseQuery;

    if (!permissive.length) return restrictedQuery;

    // permissive escapa o restrictive: (base AND restrictive) OR (base AND permissive[i])
    return {
      $or: [
        restrictedQuery,
        ...permissive.map((p) => ({ ...baseQuery, ...p })),
      ],
    };
  }

  /**
   * Compõe canRead entre todos os guards ativos.
   * Retorna true se o acesso é permitido (allow > deny > abstain = true).
   */
  async composeReadDecision(
    tableId: string,
    row: IRow,
    ctx: GuardEvalContext,
    table: ITable,
  ): Promise<boolean> {
    if (ctx.isPrivileged) return true;
    const active = await this.getActiveGuardsWithSettings(tableId);
    let sawDeny = false;
    for (const { guard, settings } of active) {
      const d = guard.canRead(row, ctx, table, settings);
      if (d === 'allow') return true; // permissive vence
      if (d === 'deny') sawDeny = true;
    }
    return !sawDeny; // só abstain = permitir
  }

  /**
   * Compõe canWrite entre todos os guards ativos.
   * allow > deny > abstain (abstain = allow por padrão).
   */
  async composeWriteDecision(
    tableId: string,
    row: IRow | null,
    ctx: GuardEvalContext,
    table: ITable,
    payload: Record<string, unknown> | null,
    operation: 'create' | 'update' | 'delete',
  ): Promise<GuardWriteDecision> {
    if (ctx.isPrivileged) return { decision: 'allow' };
    const active = await this.getActiveGuardsWithSettings(tableId);
    let firstDeny: GuardWriteDecision | null = null;
    for (const { guard, settings } of active) {
      const d = guard.canWrite(row, ctx, table, payload, operation, settings);
      if (d.decision === 'allow') return { decision: 'allow' };
      if (d.decision === 'deny' && !firstDeny) firstDeny = d;
    }
    return firstDeny ?? { decision: 'allow' };
  }

  /**
   * Compõe sanitizeWritePayload entre todos os guards restrictive (ordem estável por pluginKey).
   * Bypass de privilegiado: retorna payload inalterado.
   */
  async composeSanitize(
    tableId: string,
    payload: Record<string, unknown>,
    ctx: GuardEvalContext,
    table: ITable,
    operation: 'create' | 'update',
    currentRow: IRow | null,
  ): Promise<Record<string, unknown>> {
    if (ctx.isPrivileged) return payload;
    const active = await this.getActiveGuardsWithSettings(tableId);
    const restrictiveSorted = active
      .filter((a) => a.guard.category === 'restrictive')
      .sort((a, b) => a.guard.pluginKey.localeCompare(b.guard.pluginKey));
    let out = { ...payload };
    for (const { guard, settings } of restrictiveSorted) {
      out = guard.sanitizeWritePayload(
        out,
        ctx,
        table,
        operation,
        currentRow,
        settings,
      );
    }
    return out;
  }
}

RowAccessGuardService.register(
  RowAccessControlGuard.pluginKey,
  RowAccessControlGuard,
);
