import { Link, useRouter } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { LogOut, User } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { Spinner } from '../ui/spinner';

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
import { useAuthenticationSignOut } from '@/hooks/tanstack-query/use-authentication-sign-out';
import { useProfileRead } from '@/hooks/tanstack-query/use-profile-read';

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
      toast('Logout realizado com sucesso!', {
        className: '!bg-green-500 !text-primary-foreground !border-green-500',
        description: 'Volte sempre!',
        descriptionClassName: '!text-primary-foreground',
        closeButton: true,
      });

      router.navigate({
        to: '/',
        replace: true,
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data;

        if (data?.code === 401 && data?.cause === 'AUTHENTICATION_REQUIRED') {
          toast.error(data?.message ?? 'Authentication required');
        }

        if (data?.code === 500) {
          toast.error(data?.message ?? 'Erro interno do servidor');
        }
      }

      console.error(error);
    },
  });

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
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
                  className="flex items-center gap-2"
                >
                  <User className="size-4 mr-2" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
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
