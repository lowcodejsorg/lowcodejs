import { SendIcon, TrashIcon } from 'lucide-react';
import React from 'react';

import { ForumUserMultiSelect } from './forum-user-multi-select';

import { EditorExample } from '@/components/common/editor';
import { FileUploadWithStorage } from '@/components/common/file-upload-with-storage';
import { Button } from '@/components/ui/button';
import type { IStorage, IUser } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface ForumComposerProps {
  composerLayout: 'side' | 'bottom';
  composerText: string;
  onTextChange: (value: string) => void;
  focusKey?: string | number;
  replyMessage: { author?: IUser | string | null } | null;
  onCancelReply: () => void;
  composerStorages: Array<IStorage>;
  onRemoveStorage: (storageId: string) => void;
  composerMentions: Array<string>;
  onMentionsChange: (value: Array<string>) => void;
  composerFiles: Array<File>;
  onFilesChange: (value: Array<File>) => void;
  onStoragesChange: (storages: Array<IStorage>) => void;
  onSend: () => void;
  isEditing: boolean;
  onCancelEdit: () => void;
}

export function ForumComposer({
  composerLayout,
  composerText,
  onTextChange,
  focusKey,
  replyMessage,
  onCancelReply,
  composerStorages,
  onRemoveStorage,
  composerMentions,
  onMentionsChange,
  composerFiles,
  onFilesChange,
  onStoragesChange,
  onSend,
  isEditing,
  onCancelEdit,
}: ForumComposerProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'shrink-0 border-t',
        composerLayout === 'side'
          ? 'w-[360px] border-t-0 border-l min-h-0 overflow-y-auto'
          : 'max-h-[40vh] overflow-y-auto',
        composerLayout === 'side' ? 'p-4 space-y-3' : 'p-3 space-y-2',
      )}
    >
      {replyMessage && (
        <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-xs">
          <span>
            Respondendo a{' '}
            {typeof replyMessage.author === 'string'
              ? replyMessage.author
              : replyMessage.author?.name || 'mensagem'}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onCancelReply}
          >
            Cancelar
          </Button>
        </div>
      )}

      <EditorExample
        value={composerText}
        onChange={onTextChange}
        variant="compact"
        toolbarVariant="minimal"
        showBubble={false}
        autoFocus
        focusKey={focusKey}
        className={
          composerLayout === 'side'
            ? 'max-h-none'
            : 'max-h-[200px] min-h-[120px] p-0 gap-2'
        }
      />

      <div className="space-y-2">
        {composerStorages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {composerStorages.map((file) => (
              <div
                key={file._id}
                className="flex items-center gap-2 rounded-md border px-2 py-1 text-xs"
              >
                <span className="max-w-[160px] truncate">
                  {file.originalName}
                </span>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onRemoveStorage(file._id)}
                >
                  <TrashIcon className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1">
          <ForumUserMultiSelect
            value={composerMentions}
            onChange={onMentionsChange}
          />
        </div>
        <FileUploadWithStorage
          value={composerFiles}
          onValueChange={onFilesChange}
          onStorageChange={onStoragesChange}
          maxFiles={5}
          compact={true}
          showHint={composerLayout === 'side'}
        />
        <Button
          type="button"
          onClick={onSend}
          className="cursor-pointer w-full"
        >
          <SendIcon className="size-4" />
          {isEditing ? 'Salvar' : 'Enviar'}
        </Button>
        {isEditing && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancelEdit}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
