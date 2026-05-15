import {
  RowMemberNotificationContractService,
  type NotifyRowMembersParams,
} from './row-member-notification-contract.service';

/**
 * Implementação in-memory para testes unitários. Registra as chamadas em
 * `calls` (sem disparar notificações reais) e pode simular um erro.
 */
export default class InMemoryRowMemberNotificationService implements RowMemberNotificationContractService {
  public calls: NotifyRowMembersParams[] = [];
  private _forcedError: Error | null = null;

  simulateError(error: Error): void {
    this._forcedError = error;
  }

  async notifyNewMembers(params: NotifyRowMembersParams): Promise<void> {
    this.calls.push(params);
    if (this._forcedError) {
      const err = this._forcedError;
      this._forcedError = null;
      throw err;
    }
  }

  clear(): void {
    this.calls = [];
    this._forcedError = null;
  }
}
