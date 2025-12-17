/* eslint-disable react-refresh/only-export-components */
import { API } from "@/lib/api";
import { APP_ID, type User } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { AxiosError } from "axios";
import React from "react";

type VerifyPermission = {
  resource: string;
  owner?: string;
  administrators?: string[];
};
export interface AuthenticationContextType {
  logged: boolean;
  user: User | null;
  signIn: (payload: User) => void;
  signOut: () => void;
  verify: (payload: VerifyPermission) => boolean;
  check: () => void;
}

export const AuthenticationContext = React.createContext<
  AuthenticationContextType | undefined
>(undefined);

type AuthenticationContextProps = {
  children: React.ReactNode;
};

export const AuthenticationProvider = ({
  children,
}: AuthenticationContextProps) => {
  const [logged, setLogged] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);

  const signIn = React.useCallback((payload: User) => {
    setLogged(true);
    setUser(payload);
    localStorage.setItem(APP_ID, payload._id?.toString());
  }, []);

  const signOut = React.useCallback(() => {
    setLogged(false);
    setUser(null);
    localStorage.clear();
    sessionStorage.clear();
    // Clear all queries to prevent data leakage between users
    QueryClient.clear();
  }, []);

  const verify = React.useCallback(
    (payload: VerifyPermission) => {
      if (!user || !user.group || !user.group.permissions) return false;

      if (
        user.group.slug === "manager" &&
        payload.owner &&
        payload.owner === user._id
      )
        return true;

      if (
        payload.administrators &&
        payload.administrators?.length > 0 &&
        payload.administrators?.includes(user._id)
      )
        return true;

      const permissions = user.group.permissions.flatMap((p) => p.slug);

      return permissions.includes(payload.resource);
    },
    [user]
  );

  const check = React.useCallback(async () => {
    try {
      const sub = localStorage.getItem(APP_ID);

      // Só chama /profile se tiver indício de autenticação (token no localStorage)
      if (sub) {
        const { data } = await API.get<User>("/profile");
        setUser(data);
        setLogged(true);
        return;
      }

      // Sem token, não faz chamada desnecessária
      setLogged(false);
      setUser(null);
    } catch (error) {
      setLogged(false);
      setUser(null);

      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          localStorage.removeItem(APP_ID);
          sessionStorage.clear();
          // Clear queries on authentication error
          QueryClient.clear();
        }
      }
    }
  }, []);

  React.useEffect(() => {
    check();
  }, [check]);

  return (
    <AuthenticationContext.Provider
      value={{
        verify,
        user: user ?? null,
        signIn,
        logged,
        signOut,
        check,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
};
