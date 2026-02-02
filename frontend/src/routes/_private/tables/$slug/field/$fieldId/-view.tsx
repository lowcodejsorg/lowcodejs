/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Badge } from '@/components/ui/badge';
import {
  DATE_FORMAT_OPTIONS,
  E_FIELD_TYPE,
  FIELD_TYPE_OPTIONS,
  TEXT_FORMAT_OPTIONS,
  TEXT_LONG_FORMAT_OPTIONS,
} from '@/lib/constant';
import type { IField } from '@/lib/interfaces';

interface FieldViewProps {
  data: IField;
}

export function FieldView({ data }: FieldViewProps): React.JSX.Element {
  const typeLabel =
    FIELD_TYPE_OPTIONS.find((opt) => opt.value === data.type)?.label ||
    data.type;

  const formatLabel = (() => {
    if (!data.configuration.format) return null;

    if (data.type === E_FIELD_TYPE.TEXT_SHORT) {
      return (
        TEXT_FORMAT_OPTIONS.find(
          (opt) => opt.value === data.configuration.format,
        )?.label || data.configuration.format
      );
    }
    if (data.type === E_FIELD_TYPE.TEXT_LONG) {
      return (
        TEXT_LONG_FORMAT_OPTIONS.find(
          (opt) => opt.value === data.configuration.format,
        )?.label || data.configuration.format
      );
    }
    if (data.type === E_FIELD_TYPE.DATE) {
      return (
        DATE_FORMAT_OPTIONS.find(
          (opt) => opt.value === data.configuration.format,
        )?.label || data.configuration.format
      );
    }
    return data.configuration.format;
  })();

  return (
    <section className="space-y-4 p-2">
      {/* Nome */}
      <div className="space-y-1">
        <p className="text-sm font-medium">Nome</p>
        <p className="text-sm text-muted-foreground">{data.name || '-'}</p>
      </div>

      {/* Tipo */}
      <div className="space-y-1">
        <p className="text-sm font-medium">Tipo</p>
        <p className="text-sm text-muted-foreground">{typeLabel}</p>
      </div>

      {/* Formato (condicional) */}
      {formatLabel && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Formato</p>
          <p className="text-sm text-muted-foreground">{formatLabel}</p>
        </div>
      )}

      {/* Valor padrão (se existir) */}
      {data.configuration.defaultValue && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Valor padrão</p>
          <p className="text-sm text-muted-foreground">
            {data.configuration.defaultValue}
          </p>
        </div>
      )}

      {/* Configurações booleanas */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Configurações</p>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={data.configuration.required ? 'default' : 'secondary'}
          >
            {data.configuration.required ? 'Obrigatório' : 'Opcional'}
          </Badge>
          {data.configuration.multiple && (
            <Badge variant="outline">Múltiplos valores</Badge>
          )}
          {data.configuration.listing && (
            <Badge variant="outline">Exibir em listagem</Badge>
          )}
          {data.configuration.filtering && (
            <Badge variant="outline">Permitir filtro</Badge>
          )}
        </div>
      </div>

      {/* Dropdown options (se for dropdown) */}
      {data.type === E_FIELD_TYPE.DROPDOWN &&
        data.configuration.dropdown.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Opções do Dropdown</p>
            <div className="flex flex-wrap gap-1">
              {data.configuration.dropdown.map((opt) => (
                <Badge
                  key={opt.id}
                  variant="secondary"
                  style={
                    opt.color
                      ? {
                          backgroundColor: opt.color,
                          color: '#fff',
                        }
                      : undefined
                  }
                >
                  {opt.label}
                </Badge>
              ))}
            </div>
          </div>
        )}

      {/* Relacionamento (se for relationship) */}
      {data.type === E_FIELD_TYPE.RELATIONSHIP &&
        data.configuration.relationship && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Relacionamento</p>
            <p className="text-sm text-muted-foreground">
              Tabela: {data.configuration.relationship.table.slug}
            </p>
            <p className="text-sm text-muted-foreground">
              Campo: {data.configuration.relationship.field.slug}
            </p>
            <p className="text-sm text-muted-foreground">
              Ordem:{' '}
              {data.configuration.relationship.order === 'asc'
                ? 'Crescente'
                : 'Decrescente'}
            </p>
          </div>
        )}

      {/* Categorias (se for category) */}
      {data.type === E_FIELD_TYPE.CATEGORY &&
        data.configuration.category.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Categorias</p>
            <p className="text-sm text-muted-foreground">
              {data.configuration.category.length} categoria(s) configurada(s)
            </p>
          </div>
        )}

      {/* Grupo de campos */}
      {data.type === E_FIELD_TYPE.FIELD_GROUP && data.configuration.group && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Tabela do grupo</p>
          <p className="text-sm text-muted-foreground">
            {data.configuration.group.slug}
          </p>
        </div>
      )}

      {/* Status de lixeira */}
      {data.trashed && (
        <div className="rounded-md border border-amber-500 p-3 bg-amber-50">
          <p className="text-sm text-amber-700">Este campo está na lixeira</p>
        </div>
      )}
    </section>
  );
}
