import React from 'react';

import {
  TABLE_STYLE_OPTIONS,
} from '@/lib/constant';
import type { ITable } from '@/lib/interfaces';

interface TableViewProps {
  data: ITable;
}

export function TableView({ data }: TableViewProps): React.JSX.Element {
  // const permission = useTablePermission(data);
  const styleLabel =
    TABLE_STYLE_OPTIONS.find((opt) => opt.value === data.style)?.label ||
    data.style;

  const ACTION_LABELS: Array<{ key: keyof ITable; label: string }> = [
    { key: 'viewTable', label: 'Visualizar tabela' },
    { key: 'updateTable', label: 'Editar tabela' },
    { key: 'createField', label: 'Criar campo' },
    { key: 'updateField', label: 'Editar campo' },
    { key: 'removeField', label: 'Remover campo' },
    { key: 'viewField', label: 'Visualizar campo' },
    { key: 'createRow', label: 'Criar registro' },
    { key: 'updateRow', label: 'Editar registro' },
    { key: 'removeRow', label: 'Remover registro' },
    { key: 'viewRow', label: 'Visualizar registro' },
  ];

  return (
    <React.Fragment>
      <section
        className="space-y-4 p-2"
        data-test-id="table-detail-view"
      >
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

        {/* Permissões de acesso */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Permissões de acesso</p>
          {ACTION_LABELS.map((item) => (
            <div
              key={item.key}
              className="flex justify-between text-sm"
            >
              <span className="text-muted-foreground">{item.label}</span>
              <span>{String(data[item.key] ?? '-')}</span>
            </div>
          ))}
        </div>

        {/* Ordenação padrão */}
        <div className="space-y-1">
          <p className="text-sm font-medium">Ordenação padrão</p>
          <p className="text-sm text-muted-foreground">
            {data.order
              ? `${data.fields?.find((f) => f.slug === data.order?.field)?.name ?? data.order.field} (${data.order.direction === 'asc' ? 'Ascendente' : 'Descendente'})`
              : '-'}
          </p>
        </div>

        {/* TODO: Adicionar seção de collaborators */}
      </section>
    </React.Fragment>
  );
}
