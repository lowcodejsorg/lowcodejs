import { getRouteApi } from '@tanstack/react-router';

import { cn } from '@/lib/utils';

const rootApi = getRouteApi('__root__');

const FALLBACK_LOGO_URL = '/logo-lowcodejs.webp';

function handleLogoError(event: React.SyntheticEvent<HTMLImageElement>): void {
  const image = event.currentTarget;
  if (image.src.endsWith(FALLBACK_LOGO_URL)) return;
  image.src = FALLBACK_LOGO_URL;
}

export function Logo({ className }: { className?: string }): React.JSX.Element {
  const { baseUrl, logoLargeDarkUrl } = rootApi.useLoaderData();
  const lightSrc = `${baseUrl}/storage/logo-large.webp`;
  const darkSrc = logoLargeDarkUrl || lightSrc;

  return (
    <>
      <img
        data-slot="logo"
        data-test-id="app-logo"
        src={lightSrc}
        onError={handleLogoError}
        alt="Logo"
        className={cn(className, 'dark:hidden')}
      />
      <img
        data-slot="logo"
        data-test-id="app-logo"
        src={darkSrc}
        onError={handleLogoError}
        alt="Logo"
        className={cn(className, 'hidden dark:block')}
      />
    </>
  );
}
