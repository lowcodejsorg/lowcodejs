import { Badge } from '@/components/ui/badge';
import { E_USER_STATUS } from '@/lib/constant';
import type { IUser } from '@/lib/interfaces';

interface UserViewProps {
  data: IUser;
}

export function UserView({ data }: UserViewProps): React.JSX.Element {
  return (
    <section className="space-y-4 p-2">
      <div className="space-y-1">
        <p className="text-sm font-medium">Nome</p>
        <p className="text-sm text-muted-foreground">{data.name || '-'}</p>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">E-mail</p>
        <p className="text-sm text-muted-foreground">{data.email || '-'}</p>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">Status</p>
        <Badge
          variant={
            data.status === E_USER_STATUS.ACTIVE ? 'default' : 'secondary'
          }
        >
          {data.status === E_USER_STATUS.ACTIVE ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">Grupo</p>
        <p className="text-sm text-muted-foreground">
          {data.group.name || '-'}
        </p>
      </div>
    </section>
  );
}
