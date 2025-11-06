import { I18nContext } from "@/contexts/i18n.context";
import React from "react";

export function useI18n() {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n deve ser usado dentro de I18nProvider");
  }
  return context;
}
