import { Badge } from '@/components/ui/badge';
import {
  TABLE_COLLABORATION_OPTIONS,
  TABLE_STYLE_OPTIONS,
  TABLE_VISIBILITY_OPTIONS,
} from '@/lib/constant';
import type { ITable } from '@/lib/interfaces';

interface TableViewProps {
  data: ITable;
}

export function TableView({ data }: TableViewProps): React.JSX.Element {
  const styleLabel =
    TABLE_STYLE_OPTIONS.find((opt) => opt.value === data.configuration.style)
      ?.label || data.configuration.style;

  const visibilityLabel =
    TABLE_VISIBILITY_OPTIONS.find(
      (opt) => opt.value === data.configuration.visibility,
    )?.label || data.configuration.visibility;

  const collaborationLabel =
    TABLE_COLLABORATION_OPTIONS.find(
      (opt) => opt.value === data.configuration.collaboration,
    )?.label || data.configuration.collaboration;

  return (
    <section className="space-y-4 p-2">
      {/* Logo */}
      <div className="space-y-1">
        <p className="text-sm font-medium">Logo</p>
        {data.logo?.url ? (
          <img
            src={data.logo.url}
            alt={data.logo.filename || 'Logo da tabela'}
            className="h-16 w-auto border rounded"
          />
        ) : (
          <p className="text-sm text-muted-foreground">-</p>
        )}
      </div>

      {/* Nome */}
      <div className="space-y-1">
        <p className="text-sm font-medium">Nome</p>
        <p className="text-sm text-muted-foreground">{data.name || '-'}</p>
      </div>

      {/* Descrição */}
      <div className="space-y-1">
        <p className="text-sm font-medium">Descrição</p>
        <p className="text-sm text-muted-foreground">
          {data.description || '-'}
        </p>
      </div>

      {/* Layout de visualização */}
      <div className="space-y-1">
        <p className="text-sm font-medium">Layout de visualização</p>
        <p className="text-sm text-muted-foreground">{styleLabel}</p>
      </div>

      {/* Visibilidade */}
      <div className="space-y-1">
        <p className="text-sm font-medium">Visibilidade</p>
        <p className="text-sm text-muted-foreground">{visibilityLabel}</p>
      </div>

      {/* Colaboração */}
      <div className="space-y-1">
        <p className="text-sm font-medium">Colaboração</p>
        <p className="text-sm text-muted-foreground">{collaborationLabel}</p>
      </div>

      {/* Administradores */}
      <div className="space-y-1">
        <p className="text-sm font-medium">Administradores</p>
        {data.configuration.administrators.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {data.configuration.administrators.map((admin) => (
              <Badge
                key={typeof admin === 'string' ? admin : admin._id}
                variant="secondary"
              >
                {typeof admin === 'string' ? admin : admin.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">-</p>
        )}
      </div>
    </section>
  );
}
