import { InfoIcon } from 'lucide-react';

export function SeparatorInfo() {
  return (
    <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
      <div className="flex items-start gap-3">
        <InfoIcon className="size-5 text-primary mt-0.5" />
        <div className="flex flex-col gap-1">
          <h4 className="font-medium text-primary">Menu Separador</h4>
          <p className="text-sm text-primary">
            Este tipo de menu é usado apenas para agrupar outros itens de menu.
            Ele não possui navegação própria e serve como um organizador visual
            na estrutura do menu.
          </p>
        </div>
      </div>
    </div>
  );
}
