import { createContext, useContext } from 'react';

import type { IField } from '@/lib/interfaces';

export type VisibilityKey =
  | 'showInFilter'
  | 'showInForm'
  | 'showInDetail'
  | 'showInList';

export type WidthKey = 'widthInForm' | 'widthInList';

export interface FieldManagementActions {
  fields: Array<IField>;
  onToggleVisibility: (
    field: IField,
    visibilityKey: VisibilityKey,
    newValue: boolean,
  ) => void;
  onChangeWidth: (field: IField, widthKey: WidthKey, newWidth: number) => void;
  onSaveOrder: (
    visibilityKey: VisibilityKey,
    orderedFieldIds: Array<string>,
  ) => void;
  onDeleteField: (field: IField) => void;
  onEditField: (fieldId: string) => void;
  togglingFieldId: string | null;
  changingWidthFieldId: string | null;
  deletingFieldId: string | null;
  isSavingOrder: boolean;
}

const FieldManagementContext = createContext<FieldManagementActions | null>(
  null,
);

export const FieldManagementProvider = FieldManagementContext.Provider;

export function useFieldManagement(): FieldManagementActions {
  const context = useContext(FieldManagementContext);
  if (!context) {
    throw new Error(
      'useFieldManagement must be used within FieldManagement.Root',
    );
  }
  return context;
}
