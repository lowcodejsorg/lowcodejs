import { QueryClient as Base } from "@tanstack/react-query";

export const QueryClient = new Base({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: true,
      staleTime: 60 * 60 * 1000, // 1 hour
    },
  },
});
