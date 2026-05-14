import type { INotification } from '@application/core/entity.core';

import {
  NotificationContractService,
  type NotifyPayload,
} from './notification-contract.service';

/**
 * Implementação in-memory para testes unitários. Registra as chamadas em
 * `calls` (sem persistir nem emitir socket) e pode simular um erro.
 */
export default class InMemoryNotificationService implements NotificationContractService {
  public calls: NotifyPayload[] = [];
  private _forcedError: Error | null = null;

  simulateError(error: Error): void {
    this._forcedError = error;
  }

  async notify(payload: NotifyPayload): Promise<INotification[]> {
    this.calls.push(payload);
    if (this._forcedError) {
      const err = this._forcedError;
      this._forcedError = null;
      throw err;
    }
    return [];
  }

  clear(): void {
    this.calls = [];
    this._forcedError = null;
  }
}
