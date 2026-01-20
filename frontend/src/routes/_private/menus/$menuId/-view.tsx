import { E_MENU_ITEM_TYPE, MENU_ITEM_TYPE_OPTIONS } from '@/lib/constant';
import type { IMenu } from '@/lib/interfaces';

interface MenuViewProps {
  data: IMenu;
}

export function MenuView({ data }: MenuViewProps): React.JSX.Element {
  const typeLabel =
    MENU_ITEM_TYPE_OPTIONS.find((opt) => opt.value === data.type)?.label ||
    data.type;

  return (
    <section className="space-y-4 p-2">
      <div className="space-y-1">
        <p className="text-sm font-medium">Nome</p>
        <p className="text-sm text-muted-foreground">{data.name || '-'}</p>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">Tipo</p>
        <p className="text-sm text-muted-foreground">{typeLabel}</p>
      </div>

      {data.type !== E_MENU_ITEM_TYPE.SEPARATOR && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Menu Pai</p>
          <p className="text-sm text-muted-foreground">
            {data.parent?.name || 'Nenhum (raiz)'}
          </p>
        </div>
      )}

      {(data.type === E_MENU_ITEM_TYPE.TABLE ||
        data.type === E_MENU_ITEM_TYPE.FORM) && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Tabela</p>
          <p className="text-sm text-muted-foreground">
            {data.table?.name || '-'}
          </p>
        </div>
      )}

      {data.type === E_MENU_ITEM_TYPE.PAGE && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Conteúdo da Página</p>
          {data.html ? (
            <div
              className="text-sm text-muted-foreground prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: data.html }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">-</p>
          )}
        </div>
      )}

      {data.type === E_MENU_ITEM_TYPE.EXTERNAL && (
        <div className="space-y-1">
          <p className="text-sm font-medium">URL</p>
          {data.url ? (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {data.url}
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">-</p>
          )}
        </div>
      )}

      {data.type === E_MENU_ITEM_TYPE.SEPARATOR && (
        <div className="rounded-md border p-3 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Este item é um separador visual. Separadores são usados para
            organizar o menu em seções.
          </p>
        </div>
      )}
    </section>
  );
}
