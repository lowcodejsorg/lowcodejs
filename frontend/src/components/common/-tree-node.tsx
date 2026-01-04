import { Plus } from 'lucide-react';
import React from 'react';

import { AddNodeForm } from './-tree-editor/add-node-form';
import { TreeNodeItem } from './-tree-editor/tree-node-item';
import { useTreeEditor } from './-tree-editor/use-tree-editor';
import type { TreeNode } from './-tree-list';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TreeEditorProps {
  initialData?: Array<TreeNode>;
  onChange?: (data: Array<TreeNode>) => void;
  className?: string;
}

export const TreeEditor: React.FC<TreeEditorProps> = ({
  initialData = [],
  onChange,
  className,
}) => {
  const {
    treeData,
    selectedNodeId,
    editingNodeId,
    showAddForm,
    addFormType,
    setSelectedNodeId,
    generateId,
    findNodeById,
    handleAddRootNode,
    handleAddChildNode,
    handleSaveNewNode,
    handleCancelAdd,
    handleEditNode,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteNode,
  } = useTreeEditor(initialData, onChange);

  const renderNodeWithInlineEdit = (
    node: TreeNode,
    level: number = 0,
  ): React.ReactNode => {
    const isEditing = editingNodeId === node.id;
    const isSelected = selectedNodeId === node.id;

    return (
      <TreeNodeItem
        key={node.id}
        node={node}
        level={level}
        isSelected={isSelected}
        isEditing={isEditing}
        onSelect={() => setSelectedNodeId(node.id)}
        onEdit={() => handleEditNode(node.id)}
        onAddChild={handleAddChildNode}
        onDelete={handleDeleteNode}
        onSaveEdit={(label) => handleSaveEdit(node.id, label)}
        onCancelEdit={handleCancelEdit}
      >
        {node.children &&
          node.children.map((child) =>
            renderNodeWithInlineEdit(child, level + 1),
          )}
      </TreeNodeItem>
    );
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-end">
          <Button
            type="button"
            onClick={handleAddRootNode}
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Adicionar
          </Button>
        </div>

        {showAddForm && (
          <AddNodeForm
            type={addFormType}
            parentNodeLabel={
              selectedNodeId
                ? findNodeById(treeData, selectedNodeId)?.label
                : undefined
            }
            onSave={handleSaveNewNode}
            onCancel={handleCancelAdd}
            generateId={generateId}
          />
        )}

        <div className="relative">
          {treeData.length > 0 ? (
            <div className="rounded-md border bg-background text-sm shadow-sm">
              <div className="max-h-60 overflow-y-auto p-1">
                {treeData.map((node) => renderNodeWithInlineEdit(node))}
              </div>
            </div>
          ) : (
            <div className="rounded-md border bg-background p-6 text-center text-sm text-muted-foreground">
              <div className="space-y-1">
                <p>Nenhum item selecionado</p>
                <p className="text-xs">Clique em "Adicionar" para começar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
