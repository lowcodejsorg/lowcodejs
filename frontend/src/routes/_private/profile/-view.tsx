import type { IUser } from '@/lib/interfaces';

interface ProfileViewProps {
  data: IUser;
}

export function ProfileView({ data }: ProfileViewProps): React.JSX.Element {
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
        <p className="text-sm font-medium">Grupo</p>
        <div className="rounded-lg border p-4 bg-muted/50">
          <div className="space-y-2">
            <p className="font-medium">{data.group.name}</p>
            <p className="text-sm text-muted-foreground">
              {data.group.description || 'Sem descrição disponível'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
