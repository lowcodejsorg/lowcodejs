/* eslint-disable react-refresh/only-export-components */
import { API } from "@/lib/api";
import type { SystemSetting } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { useQuery } from "@tanstack/react-query";
import React from "react";

export type SystemConfigContextType = {
  status: "error" | "success" | "pending";
  error: Error | null;
  settings?: SystemSetting;
  invalidate: () => void;
};

export const SystemConfigContext = React.createContext<
  SystemConfigContextType | undefined
>(undefined);

export const SystemProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    data: settings,
    status,
    error,
  } = useQuery({
    queryKey: ["/setting"],
    queryFn: async () => {
      const route = "/setting";
      const { data } = await API.get<SystemSetting>(route);
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutos
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const invalidate = () => {
    QueryClient.invalidateQueries({ queryKey: ["/setting"] });
  };

  return (
    <SystemConfigContext.Provider
      value={{
        error,
        status,
        settings,
        invalidate,
      }}
    >
      {children}
    </SystemConfigContext.Provider>
  );
};
