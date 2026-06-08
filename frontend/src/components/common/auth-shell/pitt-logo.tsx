import { cn } from '@/lib/utils';

const PITT_LOGO_URL =
  'https://pitt.prpi.ufg.br/templates/g5_jlowcode/custom/images/site/logo_pitt_ufg.png';

export function PittLogo({
  className,
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <img
      src={PITT_LOGO_URL}
      alt="PITT UFG"
      className={cn('block h-auto w-auto', className)}
    />
  );
}
