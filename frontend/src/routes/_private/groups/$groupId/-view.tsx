import { Badge } from '@/components/ui/badge';
import { E_ROLE } from '@/lib/constant';
import type { IGroup } from '@/lib/interfaces';

const RoleMapper = {
  [E_ROLE.ADMINISTRATOR]: 'Administrador',
  [E_ROLE.REGISTERED]: 'Registrado',
  [E_ROLE.MANAGER]: 'Gerente',
  [E_ROLE.MASTER]: 'Dono',
};

interface GroupViewProps {
  data: IGroup;
}

export function GroupView({ data }: GroupViewProps): React.JSX.Element {
  return (
    <section className="space-y-4 p-2">
      <div className="space-y-1">
        <p className="text-sm font-medium">Slug (identificador)</p>
        <p className="text-sm text-muted-foreground">
          {RoleMapper[data.slug as keyof typeof RoleMapper] || data.slug || '-'}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">Nome</p>
        <p className="text-sm text-muted-foreground">{data.name || '-'}</p>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">Descrição</p>
        <p className="text-sm text-muted-foreground">
          {data.description || '-'}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">Permissões</p>
        {data.permissions.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {data.permissions.map((permission) => (
              <Badge
                key={permission._id}
                variant="secondary"
              >
                {permission.name}
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
