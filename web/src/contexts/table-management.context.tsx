/* eslint-disable react-refresh/only-export-components */
import { useLocation, useParams } from "@tanstack/react-router";
import React from "react";

type TableManagementProviderProps = {
  children: React.ReactNode;
};

type TableManagementProviderState = {
  slug: string;
  handleSlug: (slug: string) => void;
  reset: () => void;
};

const INITIAL_STATE: TableManagementProviderState = {
  slug: "",
  handleSlug: () => null,
  reset: () => null,
};

export const TableManagementContext =
  React.createContext<TableManagementProviderState>(INITIAL_STATE);

export function TableManagementProvider({
  children,
}: TableManagementProviderProps) {
  const location = useLocation();
  console.log(location);
  const params = useParams({ from: "/_private/tables/$slug/" });
  const [slug, setSlug] = React.useState<string>(params.slug);

  function handleSlug(slug: string) {
    setSlug(slug);
  }

  function reset() {
    setSlug(params.slug);
  }

  return (
    <TableManagementContext.Provider
      value={{
        slug,
        handleSlug,
        reset,
      }}
    >
      {children}
    </TableManagementContext.Provider>
  );
}
