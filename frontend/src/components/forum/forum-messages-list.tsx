import { FileIcon, PencilIcon, ReplyIcon, TrashIcon } from 'lucide-react';
import React from 'react';

import type { ForumMessage } from './forum-types';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { stripHtml } from '@/lib/forum-helpers';
import { getUserInitials } from '@/lib/kanban-helpers';
import { cn } from '@/lib/utils';

interface ForumMessagesListProps {
  messages: Array<ForumMessage>;
  currentUserId: string;
  endRef: React.RefObject<HTMLDivElement>;
  onReply: (messageId: string) => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onToggleReaction: (index: number, emoji: string) => void;
}

export function ForumMessagesList({
  messages,
  currentUserId,
  endRef,
  onReply,
  onEdit,
  onDelete,
  onToggleReaction,
}: ForumMessagesListProps): React.JSX.Element {
  return (
    <div className="flex-1 min-h-0 overflow-auto px-4 py-3 space-y-4">
      {messages.map((message, index) => {
        const authorName =
          typeof message.author === 'string'
            ? message.author
            : message.author?.name || message.author?.email || 'Usuario';
        const canManage = message.authorId === currentUserId;
        const hasLiked = message.reactions
          .find((r) => r.emoji === '👍')
          ?.users.includes(currentUserId);
        const hasLoved = message.reactions
          .find((r) => r.emoji === '❤️')
          ?.users.includes(currentUserId);
        const replyMessage = message.replyTo
          ? messages.find((item) => item.id === message.replyTo)
          : null;
        const replySnippet = replyMessage
          ? stripHtml(replyMessage.text || '') || 'Mensagem sem texto'
          : '';

        return (
          <div
            key={message.id}
            className="flex gap-3"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getUserInitials(message.author ?? '')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {message.dateLabel}
                </span>
                {canManage && (
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => onEdit(index)}
                      className="cursor-pointer"
                    >
                      <PencilIcon className="size-3" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => onDelete(index)}
                      className="cursor-pointer"
                    >
                      <TrashIcon className="size-3" />
                    </Button>
                  </div>
                )}
              </div>

              {replyMessage && (
                <div className="rounded-md border bg-muted/40 px-2 py-1 text-xs">
                  <div className="font-medium text-muted-foreground">
                    Respondendo a{' '}
                    {typeof replyMessage.author === 'string'
                      ? replyMessage.author
                      : replyMessage.author?.name || 'Usuario'}
                  </div>
                  <div className="line-clamp-2">{replySnippet}</div>
                </div>
              )}

              {message.text && (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: message.text }}
                />
              )}

              {message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {message.attachments.map((file) => {
                    const isImage = file.mimetype.includes('image');
                    return (
                      <a
                        key={file._id}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-md border p-2 text-xs hover:bg-muted/40"
                      >
                        {isImage ? (
                          <img
                            src={file.url}
                            alt={file.originalName}
                            className="h-12 w-12 rounded-md object-cover"
                          />
                        ) : (
                          <FileIcon className="size-5" />
                        )}
                        <span className="max-w-[160px] truncate">
                          {file.originalName}
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}

              {message.mentions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {message.mentions.map((mention, idx) => (
                    <Badge
                      key={`${message.id}-mention-${idx}`}
                      variant="secondary"
                      className="text-[10px]"
                    >
                      @
                      {typeof mention === 'string'
                        ? mention
                        : mention.name || mention.email}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onReply(message.id)}
                  className="cursor-pointer"
                >
                  <ReplyIcon className="size-4" />
                  Responder
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={hasLiked ? 'secondary' : 'ghost'}
                  onClick={() => onToggleReaction(index, '👍')}
                  className={cn(
                    'cursor-pointer transition',
                    hasLiked &&
                      'bg-primary/10 text-primary hover:bg-primary/15',
                  )}
                >
                  👍{' '}
                  {message.reactions.find((r) => r.emoji === '👍')?.users
                    .length ?? 0}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={hasLoved ? 'secondary' : 'ghost'}
                  onClick={() => onToggleReaction(index, '❤️')}
                  className={cn(
                    'cursor-pointer transition',
                    hasLoved &&
                      'bg-primary/10 text-primary hover:bg-primary/15',
                  )}
                >
                  ❤️{' '}
                  {message.reactions.find((r) => r.emoji === '❤️')?.users
                    .length ?? 0}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
      {messages.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
      )}
      <div ref={endRef} />
    </div>
  );
}
