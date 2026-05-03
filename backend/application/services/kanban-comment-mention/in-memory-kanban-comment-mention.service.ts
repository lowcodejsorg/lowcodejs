import {
  KanbanCommentMentionContractService,
  type NotifyMentionsParams,
  type NotifyMentionsResult,
} from './kanban-comment-mention-contract.service';

export default class InMemoryKanbanCommentMentionService extends KanbanCommentMentionContractService {
  public calls: NotifyMentionsParams[] = [];
  private nextResult: NotifyMentionsResult = { changed: false };
  private _forcedError: Error | null = null;

  setNextResult(result: NotifyMentionsResult): void {
    this.nextResult = result;
  }

  simulateError(error: Error): void {
    this._forcedError = error;
  }

  async notifyNewMentions(
    params: NotifyMentionsParams,
  ): Promise<NotifyMentionsResult> {
    this.calls.push(params);
    if (this._forcedError) {
      const err = this._forcedError;
      this._forcedError = null;
      throw err;
    }
    return this.nextResult;
  }

  clear(): void {
    this.calls = [];
    this.nextResult = { changed: false };
    this._forcedError = null;
  }
}
