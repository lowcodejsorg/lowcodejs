---
name: maiyu:frontend-settings-page
description: |
  Generates system settings and configuration pages for frontend projects.
  Use when: user asks to create settings page, configuration page, admin settings,
  system preferences, or mentions "settings" for application configuration UI.
  Supports: Key-value settings, sectioned forms, file uploads, enum selectors.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Project Detection

Before generating code, detect the project stack:

1. Find `package.json` (walk up directories if needed)
2. From `dependencies`/`devDependencies`, detect:
   - **Form lib**: `@tanstack/react-form` | `react-hook-form` | `formik`
   - **Query lib**: `@tanstack/react-query` | `swr`
   - **Router**: `@tanstack/react-router` | `@tanstack/react-start` | `next` | `@remix-run/react`
3. Scan existing code to detect:
   - Form setup file (`integrations/tanstack-form/form-hook.ts`)
   - Field components location (`components/common/tanstack-form/`)
   - Toast/notification system (`sonner`, `react-hot-toast`, `notistack`)
   - UI components used (Tabs, Card, Button, Switch, Input, Select)
   - Auth/permission patterns (role checks, admin guards)
4. If form lib not detected, ask user

## Conventions

### Naming
- Settings form component: `settings-form.tsx`
- Settings section component: `settings-section.tsx`
- Settings types: `settings.types.ts`
- Settings query hook: `use-settings.ts`
- Logo upload component: `settings-logo-upload.tsx`
- Route definition: `settings/index.tsx` and `settings/index.lazy.tsx`

### Rules
- No ternary operators — use `{condition && <element>}` or if/else
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and components
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains
- Named exports only
- Admin-only access guard in route `beforeLoad` or layout
- Group settings into logical sections (general, appearance, notifications, etc.)
- Each section can save independently or use a global save button
- File uploads (logo, favicon) show current preview before uploading
- Sensitive fields (passwords, API keys) use password input type

## Templates

### Settings Types — `settings.types.ts`

```typescript
interface ISettings {
  [key: string]: unknown;
}

interface ISettingField {
  key: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'toggle'
    | 'select'
    | 'file'
    | 'multiselect'
    | 'textarea'
    | 'password';
  section: string;
  options?: Array<{ label: string; value: string }>;
  description?: string;
  placeholder?: string;
}

interface ISettingsSection {
  key: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  fields: ISettingField[];
}

export type { ISettings, ISettingField, ISettingsSection };
```

### Settings Page Route (TanStack Router Reference)

**Route Definition — `settings/index.tsx`:**
```typescript
import { createFileRoute, redirect } from '@tanstack/react-router';

import { settingsListOptions } from '@/hooks/tanstack-query/_query-options';
import { profileDetailOptions } from '@/hooks/tanstack-query/_query-options';

export const Route = createFileRoute('/_private/settings/')({
  head: () => ({
    meta: [{ title: 'Settings' }],
  }),
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(
      profileDetailOptions(),
    );
    const isAdmin = user?.group?.slug === 'admin';

    if (!isAdmin) {
      throw redirect({ to: '/dashboard' });
    }
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(settingsListOptions());
  },
});
```

**Lazy Component — `settings/index.lazy.tsx`:**
```tsx
import { createLazyFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { settingsListOptions } from '@/hooks/tanstack-query/_query-options';
import { SettingsForm } from '@/components/common/settings/settings-form';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import type { ISettingsSection } from '@/lib/types/settings.types';

export const Route = createLazyFileRoute('/_private/settings/')({
  component: RouteComponent,
});

const SECTIONS: ISettingsSection[] = [
  {
    key: 'general',
    label: 'General',
    description: 'Basic application settings',
    fields: [
      {
        key: 'app_name',
        label: 'Application Name',
        type: 'text',
        section: 'general',
        placeholder: 'My Application',
      },
      {
        key: 'app_description',
        label: 'Description',
        type: 'textarea',
        section: 'general',
        placeholder: 'A brief description of the application',
      },
      {
        key: 'maintenance_mode',
        label: 'Maintenance Mode',
        type: 'toggle',
        section: 'general',
        description: 'When enabled, only admins can access the application',
      },
    ],
  },
  {
    key: 'appearance',
    label: 'Appearance',
    description: 'Customize the look and feel',
    fields: [
      {
        key: 'logo',
        label: 'Logo',
        type: 'file',
        section: 'appearance',
        description: 'Upload your application logo (PNG, SVG, max 2MB)',
      },
      {
        key: 'theme',
        label: 'Default Theme',
        type: 'select',
        section: 'appearance',
        options: [
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
          { label: 'System', value: 'system' },
        ],
      },
      {
        key: 'primary_color',
        label: 'Primary Color',
        type: 'text',
        section: 'appearance',
        placeholder: '#3b82f6',
      },
    ],
  },
  {
    key: 'notifications',
    label: 'Notifications',
    description: 'Email and notification preferences',
    fields: [
      {
        key: 'email_notifications',
        label: 'Email Notifications',
        type: 'toggle',
        section: 'notifications',
        description: 'Send email notifications for important events',
      },
      {
        key: 'smtp_host',
        label: 'SMTP Host',
        type: 'text',
        section: 'notifications',
        placeholder: 'smtp.example.com',
      },
      {
        key: 'smtp_port',
        label: 'SMTP Port',
        type: 'number',
        section: 'notifications',
        placeholder: '587',
      },
      {
        key: 'smtp_password',
        label: 'SMTP Password',
        type: 'password',
        section: 'notifications',
        placeholder: 'Enter SMTP password',
      },
    ],
  },
];

function RouteComponent(): React.JSX.Element {
  const settingsQuery = useQuery(settingsListOptions());

  if (settingsQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (settingsQuery.isError) {
    return <div>Error loading settings</div>;
  }

  const settings = settingsQuery.data ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application configuration
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          {SECTIONS.map((section) => (
            <TabsTrigger key={section.key} value={section.key}>
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SECTIONS.map((section) => (
          <TabsContent key={section.key} value={section.key}>
            <SettingsForm
              section={section}
              currentValues={settings}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function PageSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-96" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
```

### Settings Form Component — `settings-form.tsx`

```tsx
import { toast } from 'sonner';

import { useAppForm } from '@/integrations/tanstack-form/form-hook';
import { handleApiError } from '@/lib/handle-api-error';
import { createFieldErrorSetter } from '@/lib/form-utils';
import { useUpdateSettings } from '@/hooks/tanstack-query/use-settings-update';
import { SettingsSection } from './settings-section';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type { ISettings, ISettingsSection } from '@/lib/types/settings.types';

interface SettingsFormProps {
  section: ISettingsSection;
  currentValues: ISettings;
}

export function SettingsForm({
  section,
  currentValues,
}: SettingsFormProps): React.JSX.Element {
  const mutation = useUpdateSettings({
    onSuccess() {
      toast.success('Settings saved successfully');
    },
    onError(error) {
      handleApiError(error, {
        context: 'Error saving settings',
        onFieldErrors(errors) {
          const setFieldError = createFieldErrorSetter(form);
          for (const [field, message] of Object.entries(errors)) {
            setFieldError(field, message);
          }
        },
      });
    },
  });

  const defaultValues: Record<string, unknown> = {};
  for (const field of section.fields) {
    defaultValues[field.key] = currentValues[field.key] ?? '';
  }

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{section.label}</CardTitle>
        {section.description && (
          <CardDescription>{section.description}</CardDescription>
        )}
      </CardHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <CardContent>
          <SettingsSection fields={section.fields} form={form} />
        </CardContent>

        <CardFooter className="flex justify-end border-t pt-4">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && 'Saving...'}
            {!mutation.isPending && 'Save Changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

### Settings Section Component — `settings-section.tsx`

Renders a group of settings fields based on their type definition:

```tsx
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SettingsLogoUpload } from './settings-logo-upload';

import type { ISettingField } from '@/lib/types/settings.types';

interface SettingsSectionProps {
  fields: ISettingField[];
  form: ReturnType<typeof useAppForm>;
}

export function SettingsSection({
  fields,
  form,
}: SettingsSectionProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {fields.map((fieldDef) => (
        <SettingsFieldRenderer
          key={fieldDef.key}
          fieldDef={fieldDef}
          form={form}
        />
      ))}
    </div>
  );
}

interface SettingsFieldRendererProps {
  fieldDef: ISettingField;
  form: ReturnType<typeof useAppForm>;
}

function SettingsFieldRenderer({
  fieldDef,
  form,
}: SettingsFieldRendererProps): React.JSX.Element {
  if (fieldDef.type === 'toggle') {
    return <ToggleField fieldDef={fieldDef} form={form} />;
  }

  if (fieldDef.type === 'select') {
    return <SelectField fieldDef={fieldDef} form={form} />;
  }

  if (fieldDef.type === 'multiselect') {
    return <MultiselectField fieldDef={fieldDef} form={form} />;
  }

  if (fieldDef.type === 'file') {
    return <FileField fieldDef={fieldDef} form={form} />;
  }

  if (fieldDef.type === 'textarea') {
    return <TextareaField fieldDef={fieldDef} form={form} />;
  }

  if (fieldDef.type === 'password') {
    return <PasswordField fieldDef={fieldDef} form={form} />;
  }

  if (fieldDef.type === 'number') {
    return <NumberField fieldDef={fieldDef} form={form} />;
  }

  return <TextField fieldDef={fieldDef} form={form} />;
}

interface FieldComponentProps {
  fieldDef: ISettingField;
  form: ReturnType<typeof useAppForm>;
}

function TextField({ fieldDef, form }: FieldComponentProps): React.JSX.Element {
  return (
    <form.AppField
      name={fieldDef.key}
      children={(field) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid;

        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={fieldDef.key}>{fieldDef.label}</FieldLabel>
            {fieldDef.description && (
              <p className="text-sm text-muted-foreground">
                {fieldDef.description}
              </p>
            )}
            <InputGroup>
              <InputGroupInput
                id={fieldDef.key}
                name={fieldDef.key}
                type="text"
                placeholder={fieldDef.placeholder}
                value={String(field.state.value ?? '')}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.handleChange(e.target.value)
                }
                aria-invalid={isInvalid}
              />
            </InputGroup>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }}
    />
  );
}

function NumberField({
  fieldDef,
  form,
}: FieldComponentProps): React.JSX.Element {
  return (
    <form.AppField
      name={fieldDef.key}
      children={(field) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid;

        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={fieldDef.key}>{fieldDef.label}</FieldLabel>
            {fieldDef.description && (
              <p className="text-sm text-muted-foreground">
                {fieldDef.description}
              </p>
            )}
            <InputGroup>
              <InputGroupInput
                id={fieldDef.key}
                name={fieldDef.key}
                type="number"
                placeholder={fieldDef.placeholder}
                value={String(field.state.value ?? '')}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.handleChange(Number(e.target.value))
                }
                aria-invalid={isInvalid}
              />
            </InputGroup>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }}
    />
  );
}

function PasswordField({
  fieldDef,
  form,
}: FieldComponentProps): React.JSX.Element {
  return (
    <form.AppField
      name={fieldDef.key}
      children={(field) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid;

        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={fieldDef.key}>{fieldDef.label}</FieldLabel>
            {fieldDef.description && (
              <p className="text-sm text-muted-foreground">
                {fieldDef.description}
              </p>
            )}
            <InputGroup>
              <InputGroupInput
                id={fieldDef.key}
                name={fieldDef.key}
                type="password"
                placeholder={fieldDef.placeholder}
                value={String(field.state.value ?? '')}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.handleChange(e.target.value)
                }
                aria-invalid={isInvalid}
                autoComplete="off"
              />
            </InputGroup>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }}
    />
  );
}

function TextareaField({
  fieldDef,
  form,
}: FieldComponentProps): React.JSX.Element {
  return (
    <form.AppField
      name={fieldDef.key}
      children={(field) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid;

        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={fieldDef.key}>{fieldDef.label}</FieldLabel>
            {fieldDef.description && (
              <p className="text-sm text-muted-foreground">
                {fieldDef.description}
              </p>
            )}
            <Textarea
              id={fieldDef.key}
              name={fieldDef.key}
              placeholder={fieldDef.placeholder}
              value={String(field.state.value ?? '')}
              onBlur={field.handleBlur}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                field.handleChange(e.target.value)
              }
              rows={4}
              aria-invalid={isInvalid}
            />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }}
    />
  );
}

function ToggleField({
  fieldDef,
  form,
}: FieldComponentProps): React.JSX.Element {
  return (
    <form.AppField
      name={fieldDef.key}
      children={(field) => (
        <div className="flex flex-row items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <FieldLabel htmlFor={fieldDef.key}>{fieldDef.label}</FieldLabel>
            {fieldDef.description && (
              <p className="text-sm text-muted-foreground">
                {fieldDef.description}
              </p>
            )}
          </div>
          <Switch
            id={fieldDef.key}
            aria-label={fieldDef.label}
            checked={Boolean(field.state.value)}
            onCheckedChange={(checked: boolean) =>
              field.handleChange(checked)
            }
          />
        </div>
      )}
    />
  );
}

function SelectField({
  fieldDef,
  form,
}: FieldComponentProps): React.JSX.Element {
  return (
    <form.AppField
      name={fieldDef.key}
      children={(field) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid;

        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={fieldDef.key}>{fieldDef.label}</FieldLabel>
            {fieldDef.description && (
              <p className="text-sm text-muted-foreground">
                {fieldDef.description}
              </p>
            )}
            <Select
              value={String(field.state.value ?? '')}
              onValueChange={(value: string) => field.handleChange(value)}
            >
              <SelectTrigger id={fieldDef.key} aria-invalid={isInvalid}>
                <SelectValue placeholder={fieldDef.placeholder ?? 'Select...'} />
              </SelectTrigger>
              <SelectContent>
                {(fieldDef.options ?? []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }}
    />
  );
}

function MultiselectField({
  fieldDef,
  form,
}: FieldComponentProps): React.JSX.Element {
  return (
    <form.AppField
      name={fieldDef.key}
      children={(field) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid;
        const selectedValues: string[] = Array.isArray(field.state.value)
          ? field.state.value
          : [];

        function handleToggleOption(optionValue: string): void {
          const isSelected = selectedValues.includes(optionValue);
          if (isSelected) {
            field.handleChange(
              selectedValues.filter((v: string) => v !== optionValue),
            );
          } else {
            field.handleChange([...selectedValues, optionValue]);
          }
        }

        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={fieldDef.key}>{fieldDef.label}</FieldLabel>
            {fieldDef.description && (
              <p className="text-sm text-muted-foreground">
                {fieldDef.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 rounded-md border p-3">
              {(fieldDef.options ?? []).map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggleOption(option.value)}
                    className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-accent'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }}
    />
  );
}

function FileField({
  fieldDef,
  form,
}: FieldComponentProps): React.JSX.Element {
  return (
    <form.AppField
      name={fieldDef.key}
      children={(field) => (
        <SettingsLogoUpload
          label={fieldDef.label}
          description={fieldDef.description}
          currentValue={field.state.value}
          onChange={(fileOrUrl: string | File) => field.handleChange(fileOrUrl)}
        />
      )}
    />
  );
}
```

### Logo Upload with Preview — `settings-logo-upload.tsx`

```tsx
import { useState, useRef } from 'react';

import { FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

interface SettingsLogoUploadProps {
  label: string;
  description?: string;
  currentValue: unknown;
  onChange: (value: string | File) => void;
}

export function SettingsLogoUpload({
  label,
  description,
  currentValue,
  onChange,
}: SettingsLogoUploadProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const existingUrl =
    typeof currentValue === 'string' && currentValue.length > 0
      ? currentValue
      : null;
  const displayUrl = previewUrl ?? existingUrl;

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    onChange(file);
  }

  function handleRemove(): void {
    setPreviewUrl(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-3">
      <FieldLabel>{label}</FieldLabel>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div className="flex items-center gap-4">
        {displayUrl && (
          <div className="relative h-16 w-16 overflow-hidden rounded-md border">
            <img
              src={displayUrl}
              alt="Logo preview"
              className="h-full w-full object-contain"
            />
          </div>
        )}

        {!displayUrl && (
          <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed">
            <span className="text-xs text-muted-foreground">No logo</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload
          </Button>
          {displayUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
```

### Settings Query Hook — `use-settings.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/server/api';
import type { ISettings } from '@/lib/types/settings.types';

export function settingsListOptions() {
  return {
    queryKey: ['settings'],
    queryFn: async (): Promise<ISettings> => {
      const response = await api.get('/settings');
      return response.data;
    },
  };
}

interface UseUpdateSettingsOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export function useUpdateSettings(options?: UseUpdateSettingsOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ISettings>): Promise<ISettings> => {
      const response = await api.patch('/settings', data);
      return response.data;
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      options?.onSuccess?.();
    },
    onError(error) {
      options?.onError?.(error);
    },
  });
}
```

### Next.js Alternative

**Page — `app/settings/page.tsx`:**
```tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

import { settingsListOptions } from '@/hooks/tanstack-query/use-settings';
import { getServerSession } from '@/lib/auth';
import { SettingsPageContent } from './settings-page-content';

export const metadata = {
  title: 'Settings',
};

export default async function SettingsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  const isAdmin = session.user?.role === 'admin';
  if (!isAdmin) {
    redirect('/dashboard');
  }

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(settingsListOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SettingsPageContent />
    </HydrationBoundary>
  );
}
```

**Client Component — `app/settings/settings-page-content.tsx`:**
```tsx
'use client';

import { useQuery } from '@tanstack/react-query';

import { settingsListOptions } from '@/hooks/tanstack-query/use-settings';
import { SettingsForm } from '@/components/common/settings/settings-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

import type { ISettingsSection } from '@/lib/types/settings.types';

// Define SECTIONS array (same as TanStack Router version)

interface SettingsPageContentProps {
  sections: ISettingsSection[];
}

export function SettingsPageContent({
  sections,
}: SettingsPageContentProps): React.JSX.Element {
  const settingsQuery = useQuery(settingsListOptions());

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const settings = settingsQuery.data ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application configuration
        </p>
      </div>

      <Tabs defaultValue={sections[0]?.key}>
        <TabsList>
          {sections.map((section) => (
            <TabsTrigger key={section.key} value={section.key}>
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.map((section) => (
          <TabsContent key={section.key} value={section.key}>
            <SettingsForm section={section} currentValues={settings} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

### Remix Alternative

**Route — `app/routes/settings.tsx`:**
```tsx
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';

import { getSession } from '@/lib/session.server';

export const meta: MetaFunction = () => {
  return [{ title: 'Settings' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  if (!session?.user) {
    return redirect('/login');
  }

  const isAdmin = session.user.role === 'admin';
  if (!isAdmin) {
    return redirect('/dashboard');
  }

  const response = await fetch(`${process.env.API_URL}/settings`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });

  if (!response.ok) {
    throw new Response('Failed to load settings', { status: 500 });
  }

  const settings = await response.json();
  return json({ settings });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request);
  if (!session?.user) {
    return redirect('/login');
  }

  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const response = await fetch(`${process.env.API_URL}/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return json({ error: 'Failed to save settings' }, { status: 500 });
  }

  return json({ success: true });
}

export default function SettingsRoute(): React.JSX.Element {
  const { settings } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const isSaving = fetcher.state === 'submitting';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application configuration
        </p>
      </div>

      <fetcher.Form method="post">
        <div className="space-y-4">
          <div>
            <label htmlFor="app_name" className="text-sm font-medium">
              Application Name
            </label>
            <input
              id="app_name"
              name="app_name"
              type="text"
              defaultValue={settings.app_name ?? ''}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>

          {/* Add more fields per section */}

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            {isSaving && 'Saving...'}
            {!isSaving && 'Save Changes'}
          </button>
        </div>
      </fetcher.Form>
    </div>
  );
}
```

## Checklist

- [ ] Admin-only access guard in route `beforeLoad` / layout / server loader
- [ ] GET settings prefetched in loader (not in useEffect)
- [ ] PATCH settings on form submit with mutation
- [ ] Settings grouped into sections with Tabs or Cards
- [ ] Each field type rendered correctly (text, number, toggle, select, file, multiselect, textarea, password)
- [ ] File upload (logo) shows current image preview
- [ ] Success toast on save
- [ ] Error handling with `handleApiError` and field-level error mapping
- [ ] Loading skeleton while settings are fetching
- [ ] Description/help text rendered under each field
- [ ] No ternary operators
- [ ] Named exports only
- [ ] Sensitive fields use password input type
- [ ] aria attributes for accessibility
