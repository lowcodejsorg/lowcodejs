import type { LinkProps } from '@tanstack/react-router';

/**
 * Mapa de rotas que requerem permissoes especificas do sistema.
 * Rotas nao listadas aqui sao sempre permitidas.
 */
const PERMISSION_ROUTES: Array<{
  pattern: string;
  permission: string;
}> = [
  { pattern: '/groups', permission: 'USER_GROUPS' },
  { pattern: '/groups/create', permission: 'USER_GROUPS' },
  { pattern: '/groups/$groupId', permission: 'USER_GROUPS' },
  { pattern: '/users', permission: 'USERS' },
  { pattern: '/users/create', permission: 'USERS' },
  { pattern: '/users/$userId', permission: 'USERS' },
  { pattern: '/menus', permission: 'MENU' },
  { pattern: '/menus/create', permission: 'MENU' },
  { pattern: '/menus/$menuId', permission: 'MENU' },
  { pattern: '/settings', permission: 'SETTINGS' },
  { pattern: '/tools', permission: 'TOOLS' },
];

/**
 * Rotas que sao sempre permitidas para qualquer usuario autenticado.
 */
const ALWAYS_ALLOWED: Array<string> = [
  '/tables',
  '/tables/$slug',
  '/pages/$slug',
  '/profile',
];

/**
 * Rota padrao apos login — sempre /tables
 */
export const ROLE_DEFAULT_ROUTE: LinkProps['to'] = '/tables';

/**
 * Verifica se uma rota real corresponde a um padrao de rota
 * Exemplo: matchRoute('/users/123', '/users/$userId') => true
 */
function matchRoute(actualRoute: string, routePattern: string): boolean {
  const actualParts = actualRoute.split('/').filter(Boolean);
  const patternParts = routePattern.split('/').filter(Boolean);

  if (actualParts.length !== patternParts.length) {
    return false;
  }

  return patternParts.every((patternPart, index) => {
    if (patternPart.startsWith('$')) {
      return true;
    }
    return patternPart === actualParts[index];
  });
}

/**
 * Verifica se o usuario pode acessar uma rota baseado nas suas permissoes.
 * Rotas nao mapeadas sao sempre permitidas.
 */
export function canAccessRoute(
  permissions: Record<string, boolean>,
  route: string,
): boolean {
  // Verificar se a rota esta sempre permitida
  for (const pattern of ALWAYS_ALLOWED) {
    if (pattern.includes('$')) {
      if (matchRoute(route, pattern)) return true;
    } else {
      if (route === pattern) return true;
    }
  }

  // Verificar se a rota requer uma permissao especifica
  for (const entry of PERMISSION_ROUTES) {
    let matches = false;

    if (entry.pattern.includes('$')) {
      matches = matchRoute(route, entry.pattern);
    } else {
      matches = route === entry.pattern;
    }

    if (matches) {
      return permissions[entry.permission] === true;
    }
  }

  // Rotas nao mapeadas sao permitidas
  return true;
}
