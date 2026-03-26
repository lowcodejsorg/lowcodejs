import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { IUser } from '@/lib/interfaces';
import { getUserInitials } from '@/lib/kanban-helpers';

export function KanbanRowCommentsSection({
  comments,
  profile,
  currentUserId,
  rowCreatorId,
  editingCommentIndex,
  editingCommentText,
  onEditStart,
  onEditCancel,
  onEditChange,
  onSave,
  onDelete,
  commentText,
  onCommentTextChange,
  onAddComment,
}: {
  comments: Array<Record<string, any>>;
  profile?: IUser;
  currentUserId: string;
  rowCreatorId?: string;
  editingCommentIndex: number | null;
  editingCommentText: string;
  onEditStart: (index: number, comment: Record<string, any>) => void;
  onEditCancel: () => void;
  onEditChange: (value: string) => void;
  onSave: () => void;
  onDelete: (index: number) => void;
  commentText: string;
  onCommentTextChange: (value: string) => void;
  onAddComment: () => void;
}): React.JSX.Element {
  return (
    <section
      data-slot="kanban-row-comments"
      className="mt-6 space-y-3"
    >
      <h3 className="text-sm font-semibold">Comentarios</h3>
      <div className="space-y-3">
        {comments.map((comment, index) => {
          const rawAuthor = Array.isArray(comment.autor)
            ? comment.autor[0]
            : comment.autor;
          const author =
            typeof rawAuthor === 'string' &&
            profile &&
            rawAuthor === profile._id
              ? profile
              : (rawAuthor as IUser | string | undefined);
          let authorId: string | undefined;
          if (typeof author === 'string') {
            authorId = author;
          } else {
            authorId = author?._id;
          }
          const canManage =
            authorId === currentUserId || rowCreatorId === currentUserId;
          const dateLabel = comment.data
            ? format(new Date(comment.data), 'dd/MM/yyyy HH:mm', {
                locale: ptBR,
              })
            : '';

          return (
            <div
              key={index}
              className="rounded-lg border bg-background p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">
                      {getUserInitials(author ?? '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-xs">
                    <div className="font-medium">
                      {((): React.ReactNode => {
                        if (typeof author === 'string') {
                          return author;
                        }
                        return author?.name || author?.email || 'Usuario';
                      })()}
                    </div>
                    <div className="text-muted-foreground">{dateLabel}</div>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => onEditStart(index, comment)}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => onDelete(index)}
                    >
                      Excluir
                    </Button>
                  </div>
                )}
              </div>

              {((): React.ReactNode => {
                if (editingCommentIndex === index) {
                  return (
                    <div className="space-y-2">
                      <Textarea
                        value={editingCommentText}
                        onChange={(event) => onEditChange(event.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="cursor-pointer"
                          onClick={onEditCancel}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          onClick={onSave}
                          className="cursor-pointer"
                        >
                          Salvar
                        </Button>
                      </div>
                    </div>
                  );
                }
                return (
                  <p className="text-sm text-muted-foreground">
                    {comment.comentario || '-'}
                  </p>
                );
              })()}
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <Textarea
          value={commentText}
          onChange={(event) => onCommentTextChange(event.target.value)}
          placeholder="Escreva um comentario"
        />
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={onAddComment}
            className="cursor-pointer"
          >
            Enviar comentario
          </Button>
        </div>
      </div>
    </section>
  );
}
