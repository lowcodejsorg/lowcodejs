---
name: maiyu:frontend-file-upload
description: |
  Generates file upload compound components for frontend projects.
  Use when: user asks to create a file upload, dropzone, file picker,
  upload component, or mentions "upload" for file handling.
  Supports: Drag & drop, progress tracking, validation, storage API integration.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Query**: `@tanstack/react-query` (for upload mutations)
   - **HTTP**: `axios` (for multipart uploads)
3. Scan existing upload components to detect patterns

## Conventions

### Naming
- Root: `file-upload.tsx`
- Storage wrapper: `file-upload-with-storage.tsx`
- Context: `uploading-context.tsx`

### Rules
- Compound component pattern (Root + Dropzone + List + Item + Progress)
- Custom store with reducer pattern (not Context for performance)
- Controlled and uncontrolled modes
- Validation: accept, maxFiles, maxSize, onFileValidate
- Progress tracking: simulated (0-80%) + real (80-100%)
- No ternary operators — use if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and components
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### FileUpload Compound Component (Reference)

```tsx
import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';

// --- Store ---
interface FileState {
  file: File;
  progress: number;
  error: string | null;
  status: 'idle' | 'uploading' | 'error' | 'success';
}

interface UploadStore {
  files: Array<FileState>;
  addFiles: (files: Array<File>) => void;
  removeFile: (file: File) => void;
  clear: () => void;
  setProgress: (file: File, progress: number) => void;
  setSuccess: (file: File) => void;
  setError: (file: File, error: Error) => void;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => Array<FileState>;
}

function createUploadStore(): UploadStore {
  let files: Array<FileState> = [];
  const listeners = new Set<() => void>();

  function notify(): void {
    for (const listener of listeners) listener();
  }

  return {
    get files() { return files; },
    addFiles(newFiles) {
      files = [
        ...files,
        ...newFiles.map((file) => ({
          file,
          progress: 0,
          error: null,
          status: 'idle' as const,
        })),
      ];
      notify();
    },
    removeFile(file) {
      files = files.filter((f) => f.file !== file);
      notify();
    },
    clear() {
      files = [];
      notify();
    },
    setProgress(file, progress) {
      files = files.map((f) => {
        if (f.file !== file) return f;
        return { ...f, progress, status: 'uploading' };
      });
      notify();
    },
    setSuccess(file) {
      files = files.map((f) => {
        if (f.file !== file) return f;
        return { ...f, progress: 100, status: 'success' };
      });
      notify();
    },
    setError(file, error) {
      files = files.map((f) => {
        if (f.file !== file) return f;
        return { ...f, error: error.message, status: 'error' };
      });
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() { return files; },
  };
}

// --- Components ---
interface FileUploadProps {
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  onUpload?: (
    files: Array<File>,
    options: {
      onProgress: (file: File, progress: number) => void;
      onSuccess: (file: File) => void;
      onError: (file: File, error: Error) => void;
    },
  ) => Promise<void> | void;
  onFileValidate?: (file: File) => string | null | undefined;
  onFileReject?: (file: File, message: string) => void;
  children: React.ReactNode;
}

export function FileUpload({
  accept,
  maxFiles = 10,
  maxSize = 4 * 1024 * 1024,
  onUpload,
  onFileValidate,
  onFileReject,
  children,
}: FileUploadProps): React.JSX.Element {
  const store = useRef(createUploadStore()).current;
  const files = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (incoming: Array<File>) => {
      const accepted: Array<File> = [];

      for (const file of incoming) {
        if (files.length + accepted.length >= maxFiles) break;

        if (file.size > maxSize) {
          onFileReject?.(file, 'File too large');
          continue;
        }

        const validationError = onFileValidate?.(file);
        if (validationError) {
          onFileReject?.(file, validationError);
          continue;
        }

        accepted.push(file);
      }

      if (accepted.length === 0) return;

      store.addFiles(accepted);

      if (onUpload) {
        onUpload(accepted, {
          onProgress: store.setProgress,
          onSuccess: store.setSuccess,
          onError: store.setError,
        });
      }
    },
    [files.length, maxFiles, maxSize, onUpload, onFileValidate, onFileReject, store],
  );

  return (
    <div data-slot="file-upload">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
      />
      {children}
    </div>
  );
}

export function FileUploadDropzone({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div
      data-slot="file-upload-dropzone"
      className={cn(
        'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors',
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Handle dropped files
      }}
    >
      {children}
    </div>
  );
}

export function FileUploadList({
  children,
}: {
  children: (files: Array<FileState>) => React.ReactNode;
}): React.JSX.Element {
  // Render file list via render prop
  return <div data-slot="file-upload-list">{/* files rendered here */}</div>;
}

export function FileUploadItemProgress({
  progress,
}: {
  progress: number;
}): React.JSX.Element {
  return (
    <div
      data-slot="file-upload-progress"
      className="h-1 bg-muted rounded-full overflow-hidden"
    >
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
```

### Storage Wrapper (with API mutation)

```tsx
import { useMutation } from '@tanstack/react-query';
import { API } from '@/lib/api';
import type { IStorage } from '@/lib/interfaces';

interface FileUploadWithStorageProps {
  value: Array<File>;
  onValueChange: (files: Array<File>) => void;
  onStorageChange: (storages: Array<IStorage>) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
}

export function FileUploadWithStorage({
  value,
  onValueChange,
  onStorageChange,
  accept,
  maxFiles = 1,
  maxSize = 4 * 1024 * 1024,
}: FileUploadWithStorageProps): React.JSX.Element {
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await API.post<IStorage>('/storage', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
  });

  return (
    <FileUpload
      accept={accept}
      maxFiles={maxFiles}
      maxSize={maxSize}
      onUpload={async (files, { onProgress, onSuccess, onError }) => {
        for (const file of files) {
          try {
            // Simulate progress
            onProgress(file, 40);
            const storage = await uploadMutation.mutateAsync(file);
            onSuccess(file);
            onStorageChange([storage]);
          } catch (error) {
            let uploadError: Error;
            if (error instanceof Error) {
              uploadError = error;
            } else {
              uploadError = new Error(String(error));
            }
            onError(file, uploadError);
          }
        }
      }}
    >
      <FileUploadDropzone>
        <p className="text-sm text-muted-foreground">
          Drop files here or click to browse
        </p>
      </FileUploadDropzone>
    </FileUpload>
  );
}
```

## Checklist

- [ ] Compound component pattern (Root + Dropzone + List + Item)
- [ ] Custom store with pub/sub (not Context)
- [ ] File validation (accept, maxFiles, maxSize, custom)
- [ ] Progress tracking (simulated + real)
- [ ] Storage API integration with mutation
- [ ] Controlled and uncontrolled modes
- [ ] No ternary operators
