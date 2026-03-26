import { useRouter } from '@tanstack/react-router';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function RouteError({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary?: () => void;
}): React.JSX.Element {
  const router = useRouter();

  return (
    <div
      data-slot="route-error"
      className="min-h-[80vh] flex items-center justify-center px-4"
    >
      <Card className="max-w-md w-full text-center py-12">
        <CardContent>
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Algo deu errado</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {error.message || 'Ocorreu um erro inesperado. Tente novamente.'}
          </p>
          <Button
            onClick={() => {
              resetErrorBoundary?.();
              router.invalidate();
            }}
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
