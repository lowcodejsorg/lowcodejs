/**
 * Stub de RowAccessGuardService para testes unitários.
 * Não tem guards registrados — todos os métodos retornam valores permissivos
 * (sem restrição), permitindo que os use-cases sejam testados sem infra de extensões.
 */
import type { IRow, ITable } from '@application/core/entity.core';

import type {
  GuardEvalContext,
  GuardWriteDecision,
} from './row-access-guard.contract';

export class InMemoryRowAccessGuardService {
  async resolveContext(userId: string | undefined): Promise<GuardEvalContext> {
    return {
      user: undefined,
      userId,
      groupIds: new Set<string>(),
      isPrivileged: false,
    };
  }

  async composeListQuery(
    _tableId: string,
    baseQuery: Record<string, unknown>,
    _ctx: GuardEvalContext,
    _table: ITable,
  ): Promise<Record<string, unknown>> {
    return baseQuery;
  }

  async composeReadDecision(
    _tableId: string,
    _row: IRow,
    _ctx: GuardEvalContext,
    _table: ITable,
  ): Promise<boolean> {
    return true;
  }

  async composeWriteDecision(
    _tableId: string,
    _row: IRow | null,
    _ctx: GuardEvalContext,
    _table: ITable,
    _payload: Record<string, unknown> | null,
    _operation: 'create' | 'update' | 'delete',
  ): Promise<GuardWriteDecision> {
    return { decision: 'allow' };
  }

  async composeSanitize(
    _tableId: string,
    payload: Record<string, unknown>,
    _ctx: GuardEvalContext,
    _table: ITable,
    _operation: 'create' | 'update',
    _currentRow: IRow | null,
  ): Promise<Record<string, unknown>> {
    return payload;
  }
}
