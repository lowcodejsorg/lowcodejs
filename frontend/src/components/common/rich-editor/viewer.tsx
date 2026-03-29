import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

interface EditorViewerProps {
  content: string;
  className?: string;
}

export function ContentViewer({
  content,
  className,
}: EditorViewerProps): React.JSX.Element {
  if (!content) {
    return (
      <div
        data-slot="editor-viewer"
        data-test-id="rich-editor-viewer"
        className={cn('prose prose-sm max-w-none', className)}
      >
        <p className="text-muted-foreground">Sem conteudo</p>
      </div>
    );
  }

  return (
    <div
      data-slot="editor-viewer"
      data-test-id="rich-editor-viewer"
      className={cn('prose prose-sm max-w-none dark:prose-invert', className)}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
      >
        {content}
      </Markdown>
    </div>
  );
}
