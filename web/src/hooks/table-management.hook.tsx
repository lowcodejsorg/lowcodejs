import { TableManagementContext } from "@/contexts/table-management.context";
import React from "react";

export const useTableManagement = () => {
  const context = React.useContext(TableManagementContext);

  if (context === undefined)
    throw new Error(
      "useTableManagement must be used within a TableManagementProvider"
    );

  return context;
};
