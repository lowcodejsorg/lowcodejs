/* eslint-disable @typescript-eslint/require-await */
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders, setCookie } from '@tanstack/react-start/server';
import { fromUnixTime, isBefore } from 'date-fns';
import jwt from 'jsonwebtoken';

import { Env } from '@/env';

interface CookieOptions {
  maxAge?: number;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  domain?: string;
}

interface ParsedCookie {
  name: string;
  value: string;
  options: CookieOptions;
}

/**
 * Função genérica para parse de cookies de REQUEST ou RESPONSE
 * @param cookieData - String (Cookie header) ou Array (Set-Cookie headers)
 * @param cookieName - Nome do cookie a extrair
 */
function parseCookie(
  cookieData: string | Array<string> | null,
  cookieName: string,
): ParsedCookie | null {
  if (!cookieData) return null;

  // Cookie REQUEST header (string)
  if (typeof cookieData === 'string') {
    const cookies = cookieData.split(';').map((c) => c.trim());
    for (const cookie of cookies) {
      const [name, ...valueParts] = cookie.split('=');
      if (name.trim() === cookieName) {
        return {
          name: cookieName,
          value: valueParts.join('='),
          options: {},
        };
      }
    }
    return null;
  }

  // Set-Cookie RESPONSE headers (array)
  if (Array.isArray(cookieData)) {
    for (const cookieString of cookieData) {
      const parts = cookieString.split(';').map((p) => p.trim());
      const [name, ...valueParts] = parts[0].split('=');

      if (name !== cookieName) continue;

      const value = valueParts.join('=');
      const options: ParsedCookie['options'] = {};

      for (const part of parts) {
        const equalIndex = part.indexOf('=');

        if (equalIndex === -1) {
          if (part.toLowerCase() === 'httponly') options.httpOnly = true;
          if (part.toLowerCase() === 'secure') options.secure = true;
          continue;
        }

        const key = part.slice(0, equalIndex).toLowerCase();
        const val = part.slice(equalIndex + 1);

        if (key === 'max-age') options.maxAge = parseInt(val, 10);
        if (key === 'path') options.path = val;
        if (key === 'domain') options.domain = val;
        if (key === 'samesite')
          options.sameSite = val.toLowerCase() as 'strict' | 'lax' | 'none';
      }

      return { name, value, options };
    }
  }

  return null;
}

export const getCurrentAuthenticatedServerFn = createServerFn({
  method: 'GET',
}).handler(async function () {
  const headers = getRequestHeaders();
  const cookies = headers.get('cookie');

  console.log({
    cookies,
  });

  if (!cookies) return { sub: null, role: null, authenticated: false };

  const accessToken = parseCookie(cookies, 'accessToken');

  console.log({
    accessToken,
  });

  if (!accessToken) return { sub: null, role: null, authenticated: false };
  try {
    const decoded = jwt.decode(accessToken.value) as {
      sub: string;
      role: 'ADMINISTRATOR' | 'MASTER' | 'REGISTERED' | 'MANAGER';
      exp: number;
    } | null;

    console.log({ decoded });

    // Validar se decoded é válido
    if (!decoded || !decoded.exp)
      return { sub: null, role: null, authenticated: false };

    const expirationDate = fromUnixTime(decoded.exp);
    const now = new Date();

    // Checar se token expirou
    if (isBefore(expirationDate, now))
      return { sub: null, role: null, authenticated: false };

    return {
      sub: decoded.sub,
      role: decoded.role,
      authenticated: true,
    };
  } catch {
    return { sub: null, role: null, authenticated: false };
  }
});

export const refreshTokenServerFn = createServerFn({ method: 'POST' }).handler(
  async function () {
    const headers = getRequestHeaders();
    const cookies = headers.get('cookie');

    console.log({
      cookies,
    });

    if (!cookies) throw new Error('No cookies found');

    const refreshToken = parseCookie(cookies, 'refreshToken');

    if (!refreshToken) throw new Error('No refresh token found');

    try {
      const route = Env.VITE_API_BASE_URL.concat(
        '/authentication/refresh-token',
      );

      const response = await fetch(route, {
        method: 'POST',
        headers: {
          Cookie: cookies,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        //
        const errorBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorBody}`);
      }

      const accessToken = parseCookie(
        response.headers.getSetCookie(),
        'accessToken',
      );

      const newRefreshToken = parseCookie(
        response.headers.getSetCookie(),
        'refreshToken',
      );

      if (!accessToken) throw new Error('Access token not found');

      if (!newRefreshToken) throw new Error('Refresh token not found');

      console.log({
        accessToken,
        newRefreshToken,
      });

      setCookie('accessToken', accessToken.value, accessToken.options);
      setCookie('refreshToken', newRefreshToken.value, newRefreshToken.options);

      return { success: true };
    } catch (error) {
      throw new Error('Failed to refresh token');
    }
  },
);
