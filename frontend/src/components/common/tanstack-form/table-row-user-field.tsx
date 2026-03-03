import * as React from 'react';

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { useUserReadPaginated } from '@/hooks/tanstack-query/use-user-read-paginated';
import { useFieldContext } from '@/integrations/tanstack-form/form-context';
import { E_USER_STATUS } from '@/lib/constant';
import type { IField, IUser } from '@/lib/interfaces';
import { cn } from '@/lib/utils';

interface TableRowUserFieldProps {
  field: IField;
  disabled?: boolean;
}

type UserOption = {
  value: string;
  label: string;
};

export function TableRowUserField({
  field,
  disabled,
}: TableRowUserFieldProps): React.JSX.Element {
  const formField = useFieldContext<Array<UserOption>>();
  const fieldValue = Array.isArray(formField.state.value)
    ? formField.state.value
    : [];
  const isInvalid =
    formField.state.meta.isDirty && !formField.state.meta.isValid;
  const isRequired = field.required;
  const isMultiple = field.multiple;
  const anchorRef = useComboboxAnchor();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [selectedCache, setSelectedCache] = React.useState<Map<string, IUser>>(
    () => new Map(),
  );

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return (): void => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading } = useUserReadPaginated({
    page: 1,
    perPage: 50,
    search: debouncedQuery || undefined,
  });

  const users = React.useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((user) => user.status === E_USER_STATUS.ACTIVE);
  }, [data?.data]);

  React.useEffect(() => {
    if (!users.length) return;
    setSelectedCache((prev) => {
      const next = new Map(prev);
      users.forEach((user) => next.set(user._id, user));
      return next;
    });
  }, [users]);

  React.useEffect(() => {
    if (!fieldValue.length) return;
    setSelectedCache((prev) => {
      const next = new Map(prev);
      fieldValue.forEach((opt) => {
        if (next.has(opt.value)) return;
        next.set(opt.value, {
          _id: opt.value,
          name: opt.label,
          email: '',
          password: '',
          status: E_USER_STATUS.ACTIVE,
          group: null as unknown as IUser['group'],
        });
      });
      return next;
    });
  }, [fieldValue]);

  const selectedUsers = React.useMemo(() => {
    return fieldValue.map((opt) => {
      const cached = selectedCache.get(opt.value);
      const fromList = users.find((user) => user._id === opt.value);
      if (cached) return cached;
      if (fromList) return fromList;
      return {
        _id: opt.value,
        name: opt.label,
        email: '',
        password: '',
        status: E_USER_STATUS.ACTIVE,
        group: null as unknown as IUser['group'],
      };
    });
  }, [fieldValue, selectedCache, users]);

  const items = React.useMemo(() => {
    const cachedUsers = users.map(
      (user) => selectedCache.get(user._id) ?? user,
    );
    const userIds = new Set(cachedUsers.map((user) => user._id));
    const extras = selectedUsers.filter((user) => !userIds.has(user._id));
    return extras.length ? [...cachedUsers, ...extras] : cachedUsers;
  }, [selectedUsers, selectedCache, users]);

  const handleValueChange = (newValue: IUser | Array<IUser> | null): void => {
    if (isMultiple) {
      // Multi-select selection is handled manually via item click to avoid
      // combobox internal state dropping previous selections during search.
      return;
    } else {
      const user = newValue as IUser | null;
      if (user) {
        setSelectedCache((prev) => {
          const next = new Map(prev);
          next.set(user._id, user);
          return next;
        });
        formField.handleChange([
          {
            value: user._id,
            label: user.name,
          },
        ]);
      } else {
        formField.handleChange([]);
      }
    }
  };

  const handleToggleUser = (user: IUser): void => {
    const prevIds = fieldValue.map((opt) => opt.value);
    const nextIds = prevIds.includes(user._id)
      ? prevIds.filter((id) => id !== user._id)
      : [...prevIds, user._id];

    setSelectedCache((prev) => {
      const next = new Map(prev);
      next.set(user._id, user);
      return next;
    });

    const newValues = nextIds.map((id) => {
      const cached = selectedCache.get(id);
      const fallback = fieldValue.find((opt) => opt.value === id);
      return {
        value: id,
        label: cached?.name ?? fallback?.label ?? id,
      };
    });
    formField.handleChange(newValues);

    if (searchQuery.trim().length > 0) {
      setSearchQuery('');
      setDebouncedQuery('');
    }
  };

  if (isMultiple) {
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={formField.name}>
          {field.name}
          {isRequired && <span className="text-destructive"> *</span>}
        </FieldLabel>
        <div className="relative">
          <Combobox
            items={items}
            multiple
            value={selectedUsers}
            onValueChange={handleValueChange}
            inputValue={searchQuery}
            onInputValueChange={setSearchQuery}
            itemToStringLabel={(user: IUser) => user.name}
            disabled={disabled}
          >
            <ComboboxChips
              ref={anchorRef}
              className={cn(isInvalid && 'border-destructive')}
            >
              <ComboboxValue>
                {(selectedValues: Array<IUser>): React.ReactNode => (
                  <React.Fragment>
                    {selectedValues.slice(0, 2).map((user) => (
                      <ComboboxChip
                        key={user._id}
                        aria-label={user.name}
                      >
                        {user.name}
                      </ComboboxChip>
                    ))}
                    {selectedValues.length > 2 && (
                      <span className="text-muted-foreground text-xs">
                        +{selectedValues.length - 2}
                      </span>
                    )}
                    <ComboboxChipsInput
                      placeholder={
                        selectedValues.length > 0
                          ? ''
                          : `Selecione ${field.name.toLowerCase()}`
                      }
                    />
                  </React.Fragment>
                )}
              </ComboboxValue>
            </ComboboxChips>
            <ComboboxContent anchor={anchorRef}>
              <ComboboxEmpty>Nenhum usuário encontrado</ComboboxEmpty>
              {isLoading && (
                <div className="flex items-center justify-center p-3">
                  <Spinner className="opacity-50" />
                </div>
              )}
              {!isLoading && (
                <ComboboxList>
                  {(user: IUser): React.ReactNode => (
                    <ComboboxItem
                      key={user._id}
                      value={user}
                      onClick={() => handleToggleUser(user)}
                    >
                      <div className="flex flex-1 flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-muted-foreground text-sm">
                          {user.email}
                        </span>
                      </div>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              )}
            </ComboboxContent>
          </Combobox>
          {isLoading && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <Spinner className="opacity-50" />
            </div>
          )}
        </div>
        {isInvalid && <FieldError errors={formField.state.meta.errors} />}
      </Field>
    );
  }

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={formField.name}>
        {field.name}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <div className="relative">
        <Combobox
          items={items}
          value={selectedUsers[0] ?? null}
          onValueChange={handleValueChange}
          inputValue={searchQuery}
          onInputValueChange={setSearchQuery}
          itemToStringLabel={(user: IUser) => user.name}
          disabled={disabled}
        >
          <ComboboxInput
            placeholder={
              fieldValue[0]?.label || `Selecione ${field.name.toLowerCase()}`
            }
            showClear={fieldValue.length > 0}
            className={cn(isInvalid && 'border-destructive')}
          />
          <ComboboxContent>
            <ComboboxEmpty>Nenhum usuário encontrado</ComboboxEmpty>
            {isLoading && (
              <div className="flex items-center justify-center p-3">
                <Spinner className="opacity-50" />
              </div>
            )}
            {!isLoading && (
              <ComboboxList>
                {(user: IUser): React.ReactNode => (
                  <ComboboxItem
                    key={user._id}
                    value={user}
                  >
                    <div className="flex flex-1 flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-muted-foreground text-sm">
                        {user.email}
                      </span>
                    </div>
                  </ComboboxItem>
                )}
              </ComboboxList>
            )}
          </ComboboxContent>
        </Combobox>
        {isLoading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Spinner className="opacity-50" />
          </div>
        )}
      </div>
      {isInvalid && <FieldError errors={formField.state.meta.errors} />}
    </Field>
  );
}
