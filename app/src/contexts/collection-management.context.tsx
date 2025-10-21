/* eslint-disable react-refresh/only-export-components */
import { useParams } from "@tanstack/react-router";
import React from "react";

type CollectionManagementProviderProps = {
  children: React.ReactNode;
};

type CollectionManagementProviderState = {
  slug: string;
  handleSlug: (slug: string) => void;
  reset: () => void;
};

const INITIAL_STATE: CollectionManagementProviderState = {
  slug: "",
  handleSlug: () => null,
  reset: () => null,
};

export const CollectionManagementContext =
  React.createContext<CollectionManagementProviderState>(INITIAL_STATE);

export function CollectionManagementProvider({
  children,
}: CollectionManagementProviderProps) {
  const params = useParams({ from: "/_private/collections/$slug/" });
  const [slug, setSlug] = React.useState<string>(params.slug);

  function handleSlug(slug: string) {
    setSlug(slug);
  }

  function reset() {
    setSlug(params.slug);
  }

  return (
    <CollectionManagementContext.Provider
      value={{
        slug,
        handleSlug,
        reset,
      }}
    >
      {children}
    </CollectionManagementContext.Provider>
  );
}
