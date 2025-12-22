import { Plus, TreePine } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';

interface TreeEditorHeaderProps {
  onAddRootNode: () => void;
}

export const TreeEditorHeader: React.FC<TreeEditorHeaderProps> = ({
  onAddRootNode,
}) => {
  return (
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TreePine className="w-5 h-5 text-primary" />
          <span className="bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Editor de Estrutura de Árvore
          </span>
        </div>
        <Button
          type="button"
          onClick={onAddRootNode}
          size="sm"
          variant="outline"
          className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          <span>Adicionar</span>
        </Button>
      </CardTitle>
    </CardHeader>
  );
};
