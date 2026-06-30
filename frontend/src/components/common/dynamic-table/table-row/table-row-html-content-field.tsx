import DOMPurify from 'dompurify';
import React from 'react';

import type { IField } from '@/lib/interfaces';

interface TableRowHtmlContentFieldProps {
  field: IField;
}

export function TableRowHtmlContentField({
  field,
}: TableRowHtmlContentFieldProps): React.JSX.Element | null {
  if (!field.htmlContent) return null;
  const clean = DOMPurify.sanitize(field.htmlContent);
  if (!clean) return null;
  return (
    <div
      className="prose prose-sm max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
