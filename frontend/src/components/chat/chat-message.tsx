import type { UIMessage } from 'ai';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps): React.JSX.Element {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-2', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground',
        )}
      >
        {message.parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <div
                key={index}
                className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {part.text}
                </ReactMarkdown>
              </div>
            );
          }

          if (part.type.startsWith('tool-')) {
            const toolName = part.type.replace('tool-', '');
            const toolPart = part as {
              state: string;
              errorText?: string;
            };

            if (toolPart.state === 'output-error') {
              return (
                <div
                  key={index}
                  className="mt-1 rounded border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive"
                >
                  Erro: {toolPart.errorText || toolName}
                </div>
              );
            }

            if (toolPart.state === 'output-available') {
              return null;
            }

            return (
              <div
                key={index}
                className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
                Usando ferramenta: {toolName.replace(/_/g, ' ')}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
