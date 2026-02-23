/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import { randomUUID } from 'node:crypto';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  E_FIELD_TYPE,
  E_TABLE_STYLE,
  type IField,
  type IRow,
  type ITable,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import { EmailContractService } from '@application/services/email/email-contract.service';

import type {
  ForumMessageCreatePayload,
  ForumMessageDeletePayload,
  ForumMessageMentionReadPayload,
  ForumMessageUpdatePayload,
} from './forum-message.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').IRow
>;

type ForumConfig = {
  channelMembersSlug: string | null;
  channelPrivacySlug: string | null;
  messagesSlug: string;
  messageIdSlug: string;
  messageTextSlug: string;
  messageAuthorSlug: string;
  messageDateSlug: string;
  messageAttachmentsSlug: string;
  messageMentionsSlug: string;
  messageMentionEmailsSlug: string | null;
  messageMentionNotifiedSlug: string | null;
  messageMentionSeenSlug: string | null;
  messageReplySlug: string;
  messageReactionsSlug: string;
};

@Service()
export default class ForumMessageUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly userRepository: UserContractRepository,
    private readonly emailService: EmailContractService,
  ) {}

  async create(payload: ForumMessageCreatePayload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBy({
        slug: payload.slug,
        exact: true,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );
      if (table.style !== E_TABLE_STYLE.FORUM)
        return left(
          HTTPException.BadRequest(
            'This endpoint is available only for forum tables',
            'FORUM_TABLE_REQUIRED',
          ),
        );

      const config = this.resolveForumConfig(table);

      if (!config)
        return left(
          HTTPException.BadRequest(
            'Forum messages field not found',
            'FORUM_MESSAGES_FIELD_NOT_FOUND',
          ),
        );

      const c = await buildTable(table);
      const populate = await buildPopulate(
        table.fields as IField[],
        table.groups,
      );
      const row = await c.findOne({ _id: payload._id });

      if (!row)
        return left(HTTPException.NotFound('Row not found', 'ROW_NOT_FOUND'));

      if (!this.canAccessChannel(row, config, payload.user))
        return left(
          HTTPException.Forbidden(
            'User is not allowed to post in this channel',
            'FORUM_CHANNEL_ACCESS_DENIED',
          ),
        );

      const text = typeof payload.text === 'string' ? payload.text : '';
      const attachments = Array.isArray(payload.attachments)
        ? payload.attachments.filter(Boolean)
        : [];

      if (!this.hasMessageContent(text, attachments))
        return left(
          HTTPException.BadRequest(
            'Message must contain text or attachment',
            'FORUM_MESSAGE_EMPTY',
          ),
        );

      const mentions = Array.isArray(payload.mentions)
        ? payload.mentions.filter(Boolean)
        : [];
      const replyTo = payload.replyTo ?? null;
      const mentionEmails = await this.resolveMentionEmails(
        mentions,
        payload.user,
      );
      await this.sendMentionNotification(mentionEmails);

      const nextMessages = this.getMessages(row, config.messagesSlug);
      nextMessages.push({
        [config.messageIdSlug]: randomUUID(),
        [config.messageTextSlug]: text,
        [config.messageAuthorSlug]: [payload.user],
        [config.messageDateSlug]: new Date().toISOString(),
        [config.messageAttachmentsSlug]: attachments,
        [config.messageMentionsSlug]: mentions,
        ...(config.messageMentionEmailsSlug
          ? {
              [config.messageMentionEmailsSlug]:
                this.serializeStringList(mentionEmails),
            }
          : {}),
        ...(config.messageMentionNotifiedSlug
          ? {
              [config.messageMentionNotifiedSlug]:
                this.serializeStringList(mentionEmails),
            }
          : {}),
        ...(config.messageMentionSeenSlug
          ? { [config.messageMentionSeenSlug]: [] }
          : {}),
        [config.messageReplySlug]: replyTo,
        [config.messageReactionsSlug]: '[]',
      });

      return this.persistMessagesAndReturnRow({
        model: c,
        rowId: payload._id,
        messagesSlug: config.messagesSlug,
        nextMessages,
        populate,
      });
    } catch (error) {
      console.error('[ForumMessageUseCase.create]', error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'FORUM_MESSAGE_CREATE_ERROR',
        ),
      );
    }
  }

  async update(payload: ForumMessageUpdatePayload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBy({
        slug: payload.slug,
        exact: true,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );
      if (table.style !== E_TABLE_STYLE.FORUM)
        return left(
          HTTPException.BadRequest(
            'This endpoint is available only for forum tables',
            'FORUM_TABLE_REQUIRED',
          ),
        );

      const config = this.resolveForumConfig(table);

      if (!config)
        return left(
          HTTPException.BadRequest(
            'Forum messages field not found',
            'FORUM_MESSAGES_FIELD_NOT_FOUND',
          ),
        );

      const c = await buildTable(table);
      const populate = await buildPopulate(
        table.fields as IField[],
        table.groups,
      );
      const row = await c.findOne({ _id: payload._id });

      if (!row)
        return left(HTTPException.NotFound('Row not found', 'ROW_NOT_FOUND'));

      if (!this.canAccessChannel(row, config, payload.user))
        return left(
          HTTPException.Forbidden(
            'User is not allowed to edit messages in this channel',
            'FORUM_CHANNEL_ACCESS_DENIED',
          ),
        );

      const nextMessages = this.getMessages(row, config.messagesSlug);
      const messageIndex = nextMessages.findIndex(
        (message) =>
          this.normalizeId(message?.[config.messageIdSlug]) ===
          payload.messageId,
      );

      if (messageIndex < 0)
        return left(
          HTTPException.NotFound(
            'Message not found',
            'FORUM_MESSAGE_NOT_FOUND',
          ),
        );

      const currentMessage = nextMessages[messageIndex];
      const authorId = this.getMessageAuthorId(
        currentMessage?.[config.messageAuthorSlug],
      );

      if (authorId !== payload.user)
        return left(
          HTTPException.Forbidden(
            'Only the message author can edit this message',
            'FORUM_MESSAGE_AUTHOR_REQUIRED',
          ),
        );

      const nextText =
        typeof payload.text === 'string'
          ? payload.text
          : String(currentMessage?.[config.messageTextSlug] ?? '');
      const nextAttachments = Array.isArray(payload.attachments)
        ? payload.attachments.filter(Boolean)
        : this.normalizeIdList(currentMessage?.[config.messageAttachmentsSlug]);

      if (!this.hasMessageContent(nextText, nextAttachments))
        return left(
          HTTPException.BadRequest(
            'Message must contain text or attachment',
            'FORUM_MESSAGE_EMPTY',
          ),
        );

      const nextMentions = Array.isArray(payload.mentions)
        ? payload.mentions.filter(Boolean)
        : this.normalizeIdList(currentMessage?.[config.messageMentionsSlug]);
      const mentionEmails = await this.resolveMentionEmails(
        nextMentions,
        payload.user,
      );
      const alreadyNotified = config.messageMentionNotifiedSlug
        ? this.normalizeEmailList(
            currentMessage?.[config.messageMentionNotifiedSlug],
          )
        : [];
      const alreadyNotifiedSet = new Set(alreadyNotified);
      const newRecipients = mentionEmails.filter(
        (email) => !alreadyNotifiedSet.has(email),
      );
      await this.sendMentionNotification(newRecipients);

      const nextReplyTo =
        payload.replyTo !== undefined
          ? payload.replyTo
          : ((currentMessage?.[config.messageReplySlug] as string | null) ??
            null);

      nextMessages[messageIndex] = {
        ...currentMessage,
        [config.messageTextSlug]: nextText,
        [config.messageAttachmentsSlug]: nextAttachments,
        [config.messageMentionsSlug]: nextMentions,
        ...(config.messageMentionEmailsSlug
          ? {
              [config.messageMentionEmailsSlug]:
                this.serializeStringList(mentionEmails),
            }
          : {}),
        ...(config.messageMentionNotifiedSlug
          ? {
              [config.messageMentionNotifiedSlug]: this.serializeStringList(
                Array.from(new Set([...alreadyNotified, ...newRecipients])),
              ),
            }
          : {}),
        [config.messageReplySlug]: nextReplyTo,
      };

      return this.persistMessagesAndReturnRow({
        model: c,
        rowId: payload._id,
        messagesSlug: config.messagesSlug,
        nextMessages,
        populate,
      });
    } catch (error) {
      console.error('[ForumMessageUseCase.update]', error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'FORUM_MESSAGE_UPDATE_ERROR',
        ),
      );
    }
  }

  async remove(payload: ForumMessageDeletePayload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBy({
        slug: payload.slug,
        exact: true,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );
      if (table.style !== E_TABLE_STYLE.FORUM)
        return left(
          HTTPException.BadRequest(
            'This endpoint is available only for forum tables',
            'FORUM_TABLE_REQUIRED',
          ),
        );

      const config = this.resolveForumConfig(table);

      if (!config)
        return left(
          HTTPException.BadRequest(
            'Forum messages field not found',
            'FORUM_MESSAGES_FIELD_NOT_FOUND',
          ),
        );

      const c = await buildTable(table);
      const populate = await buildPopulate(
        table.fields as IField[],
        table.groups,
      );
      const row = await c.findOne({ _id: payload._id });

      if (!row)
        return left(HTTPException.NotFound('Row not found', 'ROW_NOT_FOUND'));

      if (!this.canAccessChannel(row, config, payload.user))
        return left(
          HTTPException.Forbidden(
            'User is not allowed to delete messages in this channel',
            'FORUM_CHANNEL_ACCESS_DENIED',
          ),
        );

      const nextMessages = this.getMessages(row, config.messagesSlug);
      const messageIndex = nextMessages.findIndex(
        (message) =>
          this.normalizeId(message?.[config.messageIdSlug]) ===
          payload.messageId,
      );

      if (messageIndex < 0)
        return left(
          HTTPException.NotFound(
            'Message not found',
            'FORUM_MESSAGE_NOT_FOUND',
          ),
        );

      const message = nextMessages[messageIndex];
      const authorId = this.getMessageAuthorId(
        message?.[config.messageAuthorSlug],
      );

      if (authorId !== payload.user)
        return left(
          HTTPException.Forbidden(
            'Only the message author can delete this message',
            'FORUM_MESSAGE_AUTHOR_REQUIRED',
          ),
        );

      nextMessages.splice(messageIndex, 1);
      return this.persistMessagesAndReturnRow({
        model: c,
        rowId: payload._id,
        messagesSlug: config.messagesSlug,
        nextMessages,
        populate,
      });
    } catch (error) {
      console.error('[ForumMessageUseCase.remove]', error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'FORUM_MESSAGE_DELETE_ERROR',
        ),
      );
    }
  }

  async markMentionRead(
    payload: ForumMessageMentionReadPayload,
  ): Promise<Response> {
    try {
      const table = await this.tableRepository.findBy({
        slug: payload.slug,
        exact: true,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );
      if (table.style !== E_TABLE_STYLE.FORUM)
        return left(
          HTTPException.BadRequest(
            'This endpoint is available only for forum tables',
            'FORUM_TABLE_REQUIRED',
          ),
        );

      const config = this.resolveForumConfig(table);
      if (!config)
        return left(
          HTTPException.BadRequest(
            'Forum messages field not found',
            'FORUM_MESSAGES_FIELD_NOT_FOUND',
          ),
        );
      if (!config.messageMentionSeenSlug)
        return left(
          HTTPException.BadRequest(
            'Forum mention read field not found in template',
            'FORUM_MENTION_READ_FIELD_NOT_FOUND',
          ),
        );

      const c = await buildTable(table);
      const populate = await buildPopulate(
        table.fields as IField[],
        table.groups,
      );
      const row = await c.findOne({ _id: payload._id });

      if (!row)
        return left(HTTPException.NotFound('Row not found', 'ROW_NOT_FOUND'));

      if (!this.canAccessChannel(row, config, payload.user))
        return left(
          HTTPException.Forbidden(
            'User is not allowed to access this channel',
            'FORUM_CHANNEL_ACCESS_DENIED',
          ),
        );

      const nextMessages = this.getMessages(row, config.messagesSlug);
      const messageIndex = nextMessages.findIndex(
        (message) =>
          this.normalizeId(message?.[config.messageIdSlug]) ===
          payload.messageId,
      );

      if (messageIndex < 0)
        return left(
          HTTPException.NotFound(
            'Message not found',
            'FORUM_MESSAGE_NOT_FOUND',
          ),
        );

      const currentMessage = nextMessages[messageIndex];
      const mentionIds = this.normalizeIdList(
        currentMessage?.[config.messageMentionsSlug],
      );

      if (!mentionIds.includes(payload.user)) {
        return left(
          HTTPException.BadRequest(
            'User was not mentioned in this message',
            'FORUM_MENTION_NOT_FOUND',
          ),
        );
      }

      const seenIds = this.normalizeIdList(
        currentMessage?.[config.messageMentionSeenSlug],
      );

      if (!seenIds.includes(payload.user)) {
        nextMessages[messageIndex] = {
          ...currentMessage,
          [config.messageMentionSeenSlug]: [...seenIds, payload.user],
        };
        return this.persistMessagesAndReturnRow({
          model: c,
          rowId: payload._id,
          messagesSlug: config.messagesSlug,
          nextMessages,
          populate,
        });
      }
      await row.populate(populate);
      const rowJson = row.toJSON({
        flattenObjectIds: true,
      }) as unknown as IRow;

      return right({
        ...rowJson,
        _id: row._id?.toString() ?? '',
      });
    } catch (error) {
      console.error('[ForumMessageUseCase.markMentionRead]', error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'FORUM_MENTION_READ_ERROR',
        ),
      );
    }
  }

  private resolveForumConfig(table: ITable): ForumConfig | null {
    const fields = Array.isArray(table.fields)
      ? (table.fields as IField[])
      : [];
    const messagesField =
      fields.find((field) => field.slug === 'mensagens') ??
      fields.find((field) => field.type === E_FIELD_TYPE.FIELD_GROUP);

    if (!messagesField?.slug) return null;

    const membersField = fields.find(
      (field) => field.slug === 'membros' && field.type === E_FIELD_TYPE.USER,
    );
    const privacyField = fields.find(
      (field) =>
        field.slug === 'privacidade' && field.type === E_FIELD_TYPE.DROPDOWN,
    );

    const fallbackGroupFields: Array<Pick<IField, 'slug' | 'type'>> = [
      { slug: 'mensagem-id', type: E_FIELD_TYPE.TEXT_SHORT },
      { slug: 'texto', type: E_FIELD_TYPE.TEXT_LONG },
      { slug: 'autor', type: E_FIELD_TYPE.USER },
      { slug: 'data', type: E_FIELD_TYPE.DATE },
      { slug: 'anexos', type: E_FIELD_TYPE.FILE },
      { slug: 'mencoes', type: E_FIELD_TYPE.USER },
      { slug: 'mencoes-emails', type: E_FIELD_TYPE.TEXT_LONG },
      { slug: 'mencoes-notificadas', type: E_FIELD_TYPE.TEXT_LONG },
      { slug: 'mencoes-visualizadas', type: E_FIELD_TYPE.USER },
      { slug: 'resposta', type: E_FIELD_TYPE.TEXT_SHORT },
      { slug: 'reacoes', type: E_FIELD_TYPE.TEXT_LONG },
    ];

    const groupSlug = messagesField.group?.slug;
    const group = Array.isArray(table.groups)
      ? table.groups.find((item) => item?.slug === groupSlug)
      : null;

    const groupFieldsRaw = Array.isArray(group?.fields) ? group?.fields : [];
    const actualGroupFields =
      groupFieldsRaw.length > 0 &&
      typeof groupFieldsRaw[0] === 'object' &&
      groupFieldsRaw[0] !== null &&
      'slug' in groupFieldsRaw[0]
        ? (groupFieldsRaw as IField[])
        : [];
    const groupFields =
      actualGroupFields.length > 0
        ? (groupFieldsRaw as IField[])
        : fallbackGroupFields;

    const findGroupField = (
      slug: string,
      type: (typeof E_FIELD_TYPE)[keyof typeof E_FIELD_TYPE],
    ): string | null => {
      return (
        groupFields.find((field) => field.slug === slug)?.slug ??
        groupFields.find((field) => field.type === type)?.slug ??
        null
      );
    };
    // Optional/internal fields must exist in the actual group schema.
    const findActualGroupFieldBySlug = (slug: string): string | null =>
      actualGroupFields.find((field) => field.slug === slug)?.slug ?? null;
    const getFieldSlug = (
      slug: string,
      type: (typeof E_FIELD_TYPE)[keyof typeof E_FIELD_TYPE],
    ): string => findGroupField(slug, type) ?? slug;

    return {
      channelMembersSlug: membersField?.slug ?? null,
      channelPrivacySlug: privacyField?.slug ?? null,
      messagesSlug: messagesField.slug,
      messageIdSlug: getFieldSlug('mensagem-id', E_FIELD_TYPE.TEXT_SHORT),
      messageTextSlug: getFieldSlug('texto', E_FIELD_TYPE.TEXT_LONG),
      messageAuthorSlug: getFieldSlug('autor', E_FIELD_TYPE.USER),
      messageDateSlug: getFieldSlug('data', E_FIELD_TYPE.DATE),
      messageAttachmentsSlug: getFieldSlug('anexos', E_FIELD_TYPE.FILE),
      messageMentionsSlug: getFieldSlug('mencoes', E_FIELD_TYPE.USER),
      messageMentionEmailsSlug: findActualGroupFieldBySlug('mencoes-emails'),
      messageMentionNotifiedSlug: findActualGroupFieldBySlug(
        'mencoes-notificadas',
      ),
      messageMentionSeenSlug: findActualGroupFieldBySlug(
        'mencoes-visualizadas',
      ),
      messageReplySlug: getFieldSlug('resposta', E_FIELD_TYPE.TEXT_SHORT),
      messageReactionsSlug: getFieldSlug('reacoes', E_FIELD_TYPE.TEXT_LONG),
    };
  }

  private canAccessChannel(
    row: Record<string, unknown>,
    config: ForumConfig,
    userId: string,
  ): boolean {
    const creatorId =
      this.normalizeId(row['creator']) ?? this.normalizeId(row.creator);
    if (creatorId === userId) return true;

    const isPrivate = config.channelPrivacySlug
      ? String(row[config.channelPrivacySlug] ?? '')
          .trim()
          .toLowerCase() === 'privado'
      : Boolean(config.channelMembersSlug);
    if (!isPrivate) return true;

    if (!config.channelMembersSlug) return false;
    const memberIds = this.normalizeIdList(row[config.channelMembersSlug]);

    return memberIds.includes(userId);
  }

  private getMessages(
    row: Record<string, unknown>,
    messageSlug: string,
  ): Array<Record<string, unknown>> {
    const value = row[messageSlug];

    if (!Array.isArray(value)) return [];

    return value.map((message) =>
      message && typeof message === 'object'
        ? ({ ...message } as Record<string, unknown>)
        : {},
    );
  }

  private getMessageAuthorId(value: unknown): string | null {
    const ids = this.normalizeIdList(value);
    return ids[0] ?? null;
  }

  private normalizeId(value: unknown): string | null {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (value && typeof value === 'object' && '_id' in value) {
      const id = (value as { _id?: unknown })._id;
      if (typeof id === 'string' && id.trim()) return id.trim();
      if (id && typeof id === 'object' && 'toString' in id) {
        const parsed = String(id);
        if (parsed && parsed !== '[object Object]') return parsed;
      }
    }
    if (value && typeof value === 'object' && 'toString' in value) {
      const parsed = String(value);
      if (parsed && parsed !== '[object Object]') return parsed;
    }
    return null;
  }

  private normalizeIdList(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .map((item) => this.normalizeId(item))
        .filter((item): item is string => Boolean(item));
    }

    const id = this.normalizeId(value);
    return id ? [id] : [];
  }

  private normalizeEmailList(value: unknown): string[] {
    if (typeof value === 'string') {
      const raw = value.trim();
      if (!raw) return [];
      if (raw.startsWith('[')) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed
              .map((item) =>
                String(item ?? '')
                  .trim()
                  .toLowerCase(),
              )
              .filter(Boolean);
          }
        } catch {
          // Fallback to treating it as a single value below.
        }
      }
    }
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return values
      .map((item) =>
        String(item ?? '')
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean);
  }

  private async resolveMentionEmails(
    mentionIds: string[],
    currentUserId: string,
  ): Promise<string[]> {
    const uniqueIds = Array.from(
      new Set(mentionIds.filter((id) => id && id !== currentUserId)),
    );
    if (uniqueIds.length === 0) return [];
    const users = await this.userRepository.findMany({ _ids: uniqueIds });
    return Array.from(
      new Set(
        users
          .map((user) =>
            String(user.email ?? '')
              .trim()
              .toLowerCase(),
          )
          .filter(Boolean),
      ),
    );
  }

  private async sendMentionNotification(emails: string[]): Promise<void> {
    if (emails.length === 0) return;
    try {
      await this.emailService.sendEmail({
        to: emails,
        subject: 'Você foi mencionado em um canal',
        body: 'Você recebeu uma menção em uma mensagem do fórum.',
      });
    } catch {
      // Keep forum message flow resilient even if email provider fails.
    }
  }

  private hasMessageContent(text: string, attachments: string[]): boolean {
    const plainText = text
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();

    return plainText.length > 0 || attachments.length > 0;
  }

  private serializeStringList(values: string[]): string {
    return JSON.stringify(
      values
        .map((value) =>
          String(value ?? '')
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    );
  }

  private async persistMessagesAndReturnRow(params: {
    model: Awaited<ReturnType<typeof buildTable>>;
    rowId: string;
    messagesSlug: string;
    nextMessages: Array<Record<string, unknown>>;
    populate: Awaited<ReturnType<typeof buildPopulate>>;
  }): Promise<Response> {
    const updatedRow = await params.model.findOneAndUpdate(
      { _id: params.rowId },
      { $set: { [params.messagesSlug]: params.nextMessages } },
      { new: true },
    );

    if (!updatedRow)
      return left(HTTPException.NotFound('Row not found', 'ROW_NOT_FOUND'));

    await updatedRow.populate(params.populate);
    const rowJson = updatedRow.toJSON({
      flattenObjectIds: true,
    }) as unknown as IRow;

    return right({
      ...rowJson,
      _id: updatedRow._id?.toString() ?? '',
    });
  }
}
