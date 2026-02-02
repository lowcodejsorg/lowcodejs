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
  const isInvalid =
    formField.state.meta.isTouched && !formField.state.meta.isValid;
  const isRequired = field.configuration.required;
  const isMultiple = field.configuration.multiple;
  const anchorRef = useComboboxAnchor();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');

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

  // Map selected options to IUser objects for the combobox
  const selectedUsers = React.useMemo(() => {
    return formField.state.value
      .map((opt) => users.find((user) => user._id === opt.value))
      .filter((user): user is IUser => user !== undefined);
  }, [formField.state.value, users]);

  const handleValueChange = (newValue: IUser | Array<IUser> | null): void => {
    if (isMultiple) {
      const items = newValue as Array<IUser>;
      const newValues = items.map((user) => ({
        value: user._id,
        label: user.name,
      }));
      formField.handleChange(newValues);
    } else {
      const user = newValue as IUser | null;
      if (user) {
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

  if (isMultiple) {
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={formField.name}>
          {field.name}
          {isRequired && <span className="text-destructive"> *</span>}
        </FieldLabel>
        <div className="relative">
          <Combobox
            items={users}
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
                {(values: Array<IUser>): React.ReactNode => (
                  <React.Fragment>
                    {values.slice(0, 2).map((user) => (
                      <ComboboxChip
                        key={user._id}
                        aria-label={user.name}
                      >
                        {user.name}
                      </ComboboxChip>
                    ))}
                    {values.length > 2 && (
                      <span className="text-muted-foreground text-xs">
                        +{values.length - 2}
                      </span>
                    )}
                    <ComboboxChipsInput
                      placeholder={
                        values.length > 0
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
          items={users}
          value={selectedUsers[0] ?? null}
          onValueChange={handleValueChange}
          inputValue={searchQuery}
          onInputValueChange={setSearchQuery}
          itemToStringLabel={(user: IUser) => user.name}
          disabled={disabled}
        >
          <ComboboxInput
            placeholder={
              formField.state.value[0]?.label ||
              `Selecione ${field.name.toLowerCase()}`
            }
            showClear={formField.state.value.length > 0}
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
