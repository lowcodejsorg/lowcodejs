import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { usePermissionRead } from '@/hooks/tanstack-query/use-permission-read';
import { cn } from '@/lib/utils';

interface PermissionMultiSelectProps {
  value?: Array<string>;
  onValueChange?: (value: Array<string>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PermissionMultiSelect({
  value = [],
  onValueChange,
  placeholder = 'Selecione permissões...',
  className,
  disabled = false,
}: PermissionMultiSelectProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  const { data: permissions, status } = usePermissionRead();

  const selectedPermissions = permissions?.filter((permission) =>
    value.includes(permission._id),
  );

  const handleSelect = (permissionId: string) => {
    const newValue = value.includes(permissionId)
      ? value.filter((id) => id !== permissionId)
      : [...value, permissionId];

    onValueChange?.(newValue);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between min-h-10 h-auto', className)}
          disabled={disabled || status === 'pending'}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedPermissions && selectedPermissions.length > 0 ? (
              selectedPermissions.map((permission) => (
                <Badge
                  key={permission._id}
                  variant="secondary"
                >
                  {permission.name}
                </Badge>
              ))
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="opacity-50 ml-2 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Buscar permissão..."
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>Nenhuma permissão encontrada.</CommandEmpty>
            <CommandGroup>
              {permissions?.map((permission) => (
                <CommandItem
                  key={permission._id}
                  value={`${permission.name}`}
                  onSelect={() => {
                    handleSelect(permission._id);
                  }}
                >
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{permission.name}</span>
                    {permission.description && (
                      <span className="text-sm text-muted-foreground">
                        {permission.description}
                      </span>
                    )}
                  </div>
                  <Check
                    className={cn(
                      'ml-auto',
                      value.includes(permission._id) && 'opacity-100',
                      !value.includes(permission._id) && 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
