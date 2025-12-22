import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';

interface Props {
  defaultValue?: boolean;
}
export function TableFieldListing({
  defaultValue = false,
}: Props): React.JSX.Element {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="configuration.listing"
      defaultValue={defaultValue}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <FormLabel>Exibir na listagem</FormLabel>
            <FormDescription>Exibir este campo na listagem?</FormDescription>
          </div>
          <FormControl>
            <div className="inline-flex space-x-2">
              <span className="text-sm">Não</span>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-readonly
              />
              <span className="text-sm">Sim</span>
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
}
