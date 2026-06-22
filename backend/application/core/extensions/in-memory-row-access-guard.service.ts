/**
 * Stub de RowAccessGuardService para testes unitários.
 * Não tem guards registrados — todos os métodos retornam valores permissivos
 * (sem restrição), permitindo que os use-cases sejam testados sem infra de extensões.
 *
 * Os métodos declaram apenas os parâmetros que de fato usam (os no-op não recebem
 * nenhum): a injeção nos specs é feita como `as any`, então a aridade reduzida não
 * afeta os callers, que enxergam o contrato completo.
 */
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
  ): Promise<Record<string, unknown>> {
    return baseQuery;
  }

  async composeReadDecision(): Promise<boolean> {
    return true;
  }

  async composeWriteDecision(): Promise<GuardWriteDecision> {
    return { decision: 'allow' };
  }

  async composeSanitize(
    _tableId: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return payload;
  }
}
