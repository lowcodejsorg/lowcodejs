import { Link, useRouter } from '@tanstack/react-router';
import { LogOut, User } from 'lucide-react';
import React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { useAuthenticationSignOut } from '@/hooks/tanstack-query/use-authentication-sign-out';
import { useProfileRead } from '@/hooks/tanstack-query/use-profile-read';
import { handleApiError } from '@/lib/handle-api-error';
import { toastSuccess } from '@/lib/toast';

export function Profile(): React.JSX.Element {
  const user = useProfileRead();

  const router = useRouter();

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const signOut = useAuthenticationSignOut({
    onSuccess() {
      toastSuccess('Logout realizado com sucesso!', 'Volte sempre!');

      router.navigate({
        to: '/',
        replace: true,
      });
    },
    onError(error) {
      handleApiError(error, { context: 'Erro ao fazer logout' });
    },
  });

  return (
    <DropdownMenu
      data-slot="profile"
      data-test-id="profile-dropdown"
      modal={false}
    >
      <DropdownMenuTrigger asChild>
        <Button
          data-test-id="profile-btn"
          variant="ghost"
          className="h-8 w-8 rounded-full p-0"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-slate-200 font-bold text-slate-700">
              {user.status === 'success' && getInitials(user.data.name)}
              {user.status !== 'success' && 'M'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        align="end"
        forceMount
      >
        {user.status === 'success' && (
          <React.Fragment>
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.data.name}</p>
              <p className="text-xs text-slate-600">{user.data.email}</p>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                asChild
                className="cursor-pointer"
              >
                <Link
                  to="/profile"
                  data-test-id="profile-link"
                  className="flex items-center gap-2"
                >
                  <User className="size-4 mr-2" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              data-test-id="logout-btn"
              onClick={() => signOut.mutateAsync()}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              {signOut.status !== 'pending' && (
                <LogOut className="size-4 mr-2" />
              )}
              {signOut.status === 'pending' && <Spinner />}
              <span>Sair</span>
            </DropdownMenuItem>
          </React.Fragment>
        )}

        {user.status === 'pending' && (
          <div className="px-2 py-1.5 text-xs text-slate-600 text-center">
            Carregando...
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
