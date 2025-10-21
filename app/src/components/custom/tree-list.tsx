/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import React, { useCallback, useState } from "react";

export interface TreeNode {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: TreeNode[];
  selectable?: boolean;
  metadata?: any;
}

interface TreeItemProps {
  node: TreeNode;
  level: number;
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleSelect?: (id: string, node: TreeNode) => void;
  multiSelect?: boolean;
  showCheckboxes?: boolean;
}

const TreeItem: React.FC<TreeItemProps> = ({
  node,
  level,
  selectedIds,
  expandedIds,
  onToggleExpand,
  onToggleSelect,
  multiSelect = false,
  showCheckboxes = false,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedIds.has(node.id);

  const handleToggleExpand = useCallback(() => {
    if (hasChildren) {
      onToggleExpand(node.id);
    }
  }, [hasChildren, onToggleExpand, node.id]);

  const handleSelect = useCallback(() => {
    if (node.selectable !== false && onToggleSelect) {
      onToggleSelect(node.id, node);
    }
  }, [node, onToggleSelect]);

  const itemClasses = cn(
    "flex items-center py-1 px-2 rounded-md cursor-pointer transition-colors",
    "hover:bg-tree-item-hover",
    isSelected && [
      "bg-tree-item-selected",
      "text-tree-item-selected-foreground",
      "font-medium",
    ],
    node.selectable === false && "cursor-default opacity-70"
  );

  return (
    <div>
      <div
        className={itemClasses}
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        onClick={
          !showCheckboxes && node.selectable !== false
            ? handleSelect
            : undefined
        }
      >
        {/* Expansion toggle */}
        <div
          className={cn(
            "flex items-center justify-center w-4 h-4 mr-2",
            hasChildren ? "cursor-pointer" : "cursor-default"
          )}
          onClick={
            hasChildren
              ? (e) => {
                  e.stopPropagation();
                  handleToggleExpand();
                }
              : undefined
          }
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )
          ) : (
            <div className="w-3 h-3" />
          )}
        </div>

        {/* Checkbox */}
        {showCheckboxes && node.selectable !== false && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            className="mr-2 w-4 h-4"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* Icon */}
        {node.icon && (
          <div className="mr-2 flex items-center justify-center w-4 h-4">
            {node.icon}
          </div>
        )}

        {/* Label */}
        <span className="flex-1 text-sm">{node.label}</span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onToggleSelect={onToggleSelect}
              multiSelect={multiSelect}
              showCheckboxes={showCheckboxes}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface TreeListProps {
  data: TreeNode[];
  selectedIds?: string[];
  expandedIds?: string[];
  onSelectionChange?: (
    selectedIds: string[],
    selectedNodes: TreeNode[]
  ) => void;
  onExpandedChange?: (expandedIds: string[]) => void;
  multiSelect?: boolean;
  showCheckboxes?: boolean;
  className?: string;
}

export const TreeList: React.FC<TreeListProps> = ({
  data,
  selectedIds = [],
  expandedIds = [],
  onSelectionChange,
  onExpandedChange,
  multiSelect = false,
  showCheckboxes = false,
  className,
}) => {
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(
    new Set(selectedIds)
  );
  const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(
    new Set(expandedIds)
  );

  // Use controlled or internal state
  const currentSelectedIds =
    selectedIds.length > 0 ? new Set(selectedIds) : internalSelectedIds;
  const currentExpandedIds =
    expandedIds.length > 0 ? new Set(expandedIds) : internalExpandedIds;

  const handleToggleExpand = useCallback(
    (id: string) => {
      const newExpandedIds = new Set(currentExpandedIds);
      if (newExpandedIds.has(id)) {
        newExpandedIds.delete(id);
      } else {
        newExpandedIds.add(id);
      }

      setInternalExpandedIds(newExpandedIds);
      onExpandedChange?.(Array.from(newExpandedIds));
    },
    [currentExpandedIds, onExpandedChange]
  );

  const findNodeById = useCallback(
    (nodes: TreeNode[], id: string): TreeNode | null => {
      for (const node of nodes) {
        if (node.id === id) {
          return node;
        }
        if (node.children) {
          const found = findNodeById(node.children, id);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  const handleToggleSelect = useCallback(
    (id: string, _node: TreeNode) => {
      let newSelectedIds: Set<string>;

      if (multiSelect) {
        newSelectedIds = new Set(currentSelectedIds);
        if (newSelectedIds.has(id)) {
          newSelectedIds.delete(id);
        } else {
          newSelectedIds.add(id);
        }
      } else {
        newSelectedIds = new Set([id]);
      }

      setInternalSelectedIds(newSelectedIds);

      if (onSelectionChange) {
        const selectedNodes = Array.from(newSelectedIds)
          .map((id) => findNodeById(data, id))
          .filter((node): node is TreeNode => node !== null);

        onSelectionChange(Array.from(newSelectedIds), selectedNodes);
      }
    },
    [currentSelectedIds, multiSelect, onSelectionChange, findNodeById, data]
  );

  return (
    <div className={cn("space-y-1", className)}>
      {data.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          level={0}
          selectedIds={currentSelectedIds}
          expandedIds={currentExpandedIds}
          onToggleExpand={handleToggleExpand}
          onToggleSelect={handleToggleSelect}
          multiSelect={multiSelect}
          showCheckboxes={showCheckboxes}
        />
      ))}
    </div>
  );
};
