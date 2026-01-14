import { ArrowRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DocumentHeaderActions({
  onViewDetails,
}: {
  onViewDetails: () => void;
}) {
  return (
    <div className="flex justify-end w-full">
      <Button
        variant="ghost"
        className="p-0 flex items-center gap-2"
        onClick={onViewDetails}
      >
        <span>Ver detalhes</span>
        <ArrowRightIcon />
      </Button>
    </div>
  );
}
