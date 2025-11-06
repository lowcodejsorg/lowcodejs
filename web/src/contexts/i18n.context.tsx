/* eslint-disable react-refresh/only-export-components */
import { useSystemConfig } from "@/hooks/system-config.hook";
import { API } from "@/lib/api";
import type { Locale, Translation } from "@/lib/entity";
import { QueryClient } from "@/lib/query-client";
import { useQuery } from "@tanstack/react-query";
import React from "react";

export type I18nContextType = {
  t: (
    key: keyof Translation,
    defaultValue?: string | string[]
  ) => string | string[];
  change: (language: Locale) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  translations?: Translation;
  invalidate: () => void;
};

export const I18nContext = React.createContext<I18nContextType | undefined>(
  undefined
);

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useSystemConfig();

  const {
    data: translations,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "/locales/".concat(settings?.LOCALE ?? "en-us"),
      settings?.LOCALE,
    ],
    queryFn: async () => {
      const route = "/locales/".concat(settings?.LOCALE ?? "en-us");
      const { data } = await API.get<Translation>(route);
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutos
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: Boolean(settings?.LOCALE),
  });

  const change = async (language: Locale) => {
    await QueryClient.prefetchQuery({
      queryKey: ["/locales/".concat(language), language],
      queryFn: async () => {
        const route = "/locales/".concat(language);
        const { data } = await API.get<Translation>(route);
        return data;
      },
      staleTime: 1000 * 60 * 30,
    });
  };

  const t = (key: keyof Translation, defaultValue: string | string[] = key) => {
    return translations?.[key] || defaultValue;
  };

  function invalidate() {
    QueryClient.invalidateQueries({ queryKey: ["i18n"] });
  }

  const value = {
    t,
    change,
    isLoading,
    error,
    translations,
    invalidate,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
