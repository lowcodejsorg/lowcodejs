import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { permissionOptions } from './_query-options';

import type { IPermission } from '@/lib/interfaces';

export function usePermissionRead(): UseQueryResult<Array<IPermission>, Error> {
  return useQuery(permissionOptions());
}
