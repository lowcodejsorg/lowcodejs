import { LockIcon, ShieldCheckIcon, UsersIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  E_ROLE,
  PERMISSION_LABEL_MAPPER,
  SYSTEM_PERMISSION_LABEL_MAPPER,
  USER_GROUP_MAPPER,
} from '@/lib/constant';
import type { IGroup } from '@/lib/interfaces';

const RoleMapper: Record<string, string> = {
  [E_ROLE.ADMINISTRATOR]: 'Administrador',
  [E_ROLE.REGISTERED]: 'Registrado',
  [E_ROLE.MANAGER]: 'Gerente',
  [E_ROLE.MASTER]: 'Dono',
};

function resolveGroupSlugLabel(slug: string): string {
  return RoleMapper[slug] ?? slug ?? '-';
}

function resolveEncompassesLabel(group: {
  slug: string;
  name: string;
}): string {
  const mapped: Record<string, string> = USER_GROUP_MAPPER;
  return mapped[group.slug] ?? group.name;
}

interface GroupViewProps {
  data: IGroup;
}

function renderSystemPermissions(
  systemPermissions: Record<string, boolean>,
): React.JSX.Element {
  const enabled = Object.entries(systemPermissions).filter(
    ([, value]) => value === true,
  );

  if (enabled.length === 0) {
    return <p className="text-sm text-muted-foreground">-</p>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {enabled.map(([key]) => (
        <Badge
          key={key}
          variant="secondary"
        >
          {SYSTEM_PERMISSION_LABEL_MAPPER[key] ?? key}
        </Badge>
      ))}
    </div>
  );
}

function renderPermissions(
  permissions: IGroup['permissions'],
): React.JSX.Element {
  if (permissions.length === 0) {
    return <p className="text-sm text-muted-foreground">-</p>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {permissions.map((permission) => (
        <Badge
          key={permission._id}
          variant="secondary"
        >
          {PERMISSION_LABEL_MAPPER[permission.slug] ?? permission.name}
        </Badge>
      ))}
    </div>
  );
}

export function GroupView({ data }: GroupViewProps): React.JSX.Element {
  return (
    <section
      className="space-y-6 p-4"
      data-test-id="group-detail-view"
    >
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <UsersIcon className="h-4 w-4 text-primary" />
            </div>
            Informações do Grupo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Slug (identificador)
            </p>
            <p className="text-sm font-medium">
              {resolveGroupSlugLabel(data.slug)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Nome
            </p>
            <p className="text-sm font-medium">{data.name || '-'}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Descrição
            </p>
            <p className="text-sm font-medium">{data.description || '-'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheckIcon className="h-4 w-4 text-primary" />
            </div>
            Permissões
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Permissões atribuídas
            </p>
            {renderPermissions(data.permissions ?? [])}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Permissões do sistema
            </p>
            {renderSystemPermissions(data.systemPermissions ?? {})}
          </div>
        </CardContent>
      </Card>

      {(data.encompasses ?? []).length > 0 && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <UsersIcon className="h-4 w-4 text-primary" />
              </div>
              Abrange
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Grupos englobados
              </p>
              <div className="flex flex-wrap gap-1">
                {(data.encompasses ?? []).map((group) => {
                  const label = resolveEncompassesLabel(group);
                  return (
                    <Badge
                      key={group._id}
                      variant="secondary"
                    >
                      {label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {data.immutable && (
        <Card className="shadow-none border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900">
                <LockIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              Grupo Imutável
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Este grupo é imutável e não pode ser editado ou removido.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
