import type { IStorage, IUser } from '@/lib/interfaces';

export type ForumMessage = {
  id: string;
  text: string;
  author: IUser | string | null;
  authorId: string | null;
  dateLabel: string;
  dateValue: string | null;
  attachments: Array<IStorage>;
  mentions: Array<IUser | string>;
  replyTo: string | null;
  reactions: Array<{ emoji: string; users: Array<string> }>;
  raw: Record<string, unknown>;
};

export type ForumDocument = {
  messageId: string;
  file: IStorage;
  author: IUser | string | null;
  dateLabel: string;
};
