import { Link } from '@tanstack/react-router';
import { SearchX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function RouteNotFound(): React.JSX.Element {
  return (
    <div
      data-slot="route-not-found"
      data-test-id="route-not-found-page"
      className="min-h-[80vh] flex items-center justify-center px-4"
    >
      <Card className="max-w-md w-full text-center py-12">
        <CardContent>
          <SearchX className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Pagina nao encontrada</h2>
          <p className="text-muted-foreground text-sm mb-6">
            O recurso que voce procura nao existe ou foi removido.
          </p>
          <Button asChild>
            <Link to="/">Voltar ao inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
