import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReadTable } from '@/integrations/tanstack-query/implementations/use-table-read';
import { FIELD_TYPE } from '@/lib/constant';
import { cn } from '@/lib/utils';

// type Option = SelectOption & {
//   slug?: string;
// };

interface TableFieldTypeProps {
  required?: boolean;
  defaultValue?: string;
  disabled?: boolean;
  tableSlug: string;
}

export function TableFieldType({
  defaultValue,
  required,
  disabled = false,
  tableSlug,
}: TableFieldTypeProps): React.JSX.Element {
  const form = useFormContext();

  const table = useReadTable({ slug: tableSlug });

  let COLUMN_TYPE_LIST = [
    {
      label: 'Texto',
      value: FIELD_TYPE.TEXT_SHORT,
    },
    {
      label: 'Texto longo',
      value: FIELD_TYPE.TEXT_LONG,
    },
    {
      label: 'Dropdown',
      value: FIELD_TYPE.DROPDOWN,
    },
    {
      label: 'Arquivo',
      value: FIELD_TYPE.FILE,
    },
    {
      label: 'Data',
      value: FIELD_TYPE.DATE,
    },
    {
      label: 'Relacionamento',
      value: FIELD_TYPE.RELATIONSHIP,
    },
    {
      label: 'Grupo de campos',
      value: FIELD_TYPE.FIELD_GROUP,
    },
    {
      label: 'Árvore',
      value: FIELD_TYPE.CATEGORY,
    },
    {
      label: 'Reação',
      value: FIELD_TYPE.REACTION,
    },
    {
      label: 'Avaliação',
      value: FIELD_TYPE.EVALUATION,
    },
  ];

  const BLOCKED_FIELD_TYPES = [
    FIELD_TYPE.FIELD_GROUP,
    FIELD_TYPE.REACTION,
    FIELD_TYPE.EVALUATION,
  ];

  if (table.status === 'success' && table.data.type === 'field-group') {
    COLUMN_TYPE_LIST = COLUMN_TYPE_LIST.filter(
      (item) => !BLOCKED_FIELD_TYPES.includes(item.value),
    );
  }

  return (
    <FormField
      control={form.control}
      name="type"
      defaultValue={defaultValue}
      disabled={disabled}
      rules={{
        validate: (value) => {
          if (!value && required) return 'Tipo é obrigatório';

          return true;
        },
      }}
      render={({ field }) => {
        const hasError = !!form.formState.errors[field.name];

        return (
          <FormItem className="w-full">
            <FormLabel className="data-[error=true]:text-destructive">
              Tipo
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <SelectTrigger
                  className={cn('w-full', hasError && 'border-destructive')}
                >
                  <SelectValue placeholder="Selecione o tipo do campo" />
                </SelectTrigger>
                <SelectContent>
                  {COLUMN_TYPE_LIST.map((item) => (
                    <SelectItem
                      value={item.value}
                      key={item.value}
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage className="text-right text-destructive" />
          </FormItem>
        );
      }}
    />
  );
}
