import { CollectionManagementContext } from "@/contexts/collection-management.context";
import React from "react";

export const useCollectionManagement = () => {
  const context = React.useContext(CollectionManagementContext);

  if (context === undefined)
    throw new Error(
      "useCollectionManagement must be used within a CollectionManagementProvider"
    );

  return context;
};
