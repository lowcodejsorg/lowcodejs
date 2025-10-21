import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Edit2, Plus, Trash2 } from "lucide-react";
import React from "react";
import { type TreeNode } from "../tree-list";
import { InlineEditForm } from "./inline-edit-form";

interface TreeNodeItemProps {
  node: TreeNode;
  level: number;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onAddChild: () => void;
  onDelete: () => void;
  onSaveEdit: (label: string) => void;
  onCancelEdit: () => void;
  children?: React.ReactNode;
}

export const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  level,
  isSelected,
  isEditing,
  onSelect,
  onEdit,
  onAddChild,
  onDelete,
  onSaveEdit,
  onCancelEdit,
  children,
}) => {
  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-sm transition-colors cursor-pointer group",
          "hover:bg-accent text-sm",
          isSelected && "bg-accent text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={handleNodeClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="option"
        aria-selected={isSelected}
      >
        {isEditing ? (
          <InlineEditForm
            initialValue={node.label}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
          />
        ) : (
          <>
            <span className="flex-1 truncate">{node.label}</span>
            {/* {!node.selectable && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                Info
              </span>
            )} */}

            {isSelected && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddChild();
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="w-3 h-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {children && <div className="ml-2">{children}</div>}
    </div>
  );
};
