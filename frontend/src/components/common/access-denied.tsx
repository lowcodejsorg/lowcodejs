import { useRouter } from '@tanstack/react-router';
import { ShieldXIcon } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export function AccessDenied(): React.JSX.Element {
  const router = useRouter();

  return (
    <Empty className="from-muted/50 to-background h-full bg-linear-to-b from-30%">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldXIcon />
        </EmptyMedia>
        <EmptyTitle>Acesso negado</EmptyTitle>
        <EmptyDescription>
          Você não tem permissão para acessar esta página.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            router.history.back();
          }}
        >
          Voltar
        </Button>
      </EmptyContent>
    </Empty>
  );
}
