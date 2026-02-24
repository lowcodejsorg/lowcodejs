import { Loader2 } from 'lucide-react';

export default function RoutePending(): React.JSX.Element {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}
