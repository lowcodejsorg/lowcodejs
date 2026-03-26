import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import type { ChatMessage as ChatMessageData } from '@/hooks/use-chat-socket';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps): React.JSX.Element {
  const isUser = message.role === 'user';

  return (
    <div
      data-slot="chat-message"
      className={cn(
        'flex gap-2',
        isUser && 'justify-end',
        !isUser && 'justify-start',
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm',
          isUser && 'bg-primary text-primary-foreground',
          !isUser && 'bg-muted text-foreground',
        )}
      >
        {/* Indicador de arquivo enviado */}
        {message.file && (
          <div className="mb-1 text-xs opacity-70">
            {message.file.type === 'image' ? 'Imagem' : 'PDF'}:{' '}
            {message.file.filename}
          </div>
        )}
        <div
          className={cn(
            'prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
            isUser && 'prose-invert',
            !isUser && 'dark:prose-invert',
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
