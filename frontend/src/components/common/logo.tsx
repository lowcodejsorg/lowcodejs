import { getRouteApi } from '@tanstack/react-router';

const rootApi = getRouteApi('__root__');

export function Logo({ className }: { className?: string }): React.JSX.Element {
  const { baseUrl } = rootApi.useLoaderData();
  return (
    <img
      src={`${baseUrl}/storage/logo-large.webp`}
      alt="Logo"
      className={className}
    />
  );
}
