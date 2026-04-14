---
name: maiyu:frontend-tree-component
description: |
  Generates hierarchical tree components with drag-and-drop, inline editing,
  expand/collapse, and CRUD operations.
  Use when: user asks to create tree views, hierarchical lists, nested menus,
  category trees, or mentions "tree", "hierarchy", "nested list".
  Supports: dnd-kit, inline edit, checkboxes, expand/collapse.
  Frameworks: TanStack Start, React (Vite), Next.js, Remix.
metadata:
  author: low-code-js
  version: "1.0.0"
---

## Conventions

### Rules
- No ternary operators — use if/else, early return, or const mapper
- No `any` type — use concrete types, `unknown`, generics, or `Record<string, unknown>`
- No `as TYPE` assertions (except `as const`) — use type guards, generics, or proper typing
- Explicit return types on all functions and components
- Multiple conditions use const mapper (`Record` lookup) instead of switch/if-else chains

## Templates

### Tree Node Type

```typescript
export interface TreeNode {
  id: string
  label: string
  children?: TreeNode[]
  expanded?: boolean
}
```

### TreeList (Read-Only)

```tsx
import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TreeListProps {
  nodes: TreeNode[]
  selectedId?: string
  onSelect?: (node: TreeNode) => void
  depth?: number
}

export function TreeList({
  nodes,
  selectedId,
  onSelect,
  depth = 0,
}: TreeListProps): React.JSX.Element {
  return (
    <ul className="space-y-0.5" role="tree">
      {nodes.map((node) => {
        const hasChildren = node.children && node.children.length > 0
        const isSelected = node.id === selectedId

        return (
          <li key={node.id} role="treeitem" aria-expanded={node.expanded}>
            <button
              className={cn(
                'flex items-center gap-1 w-full rounded px-2 py-1.5 text-sm hover:bg-muted',
                isSelected && 'bg-accent text-accent-foreground',
              )}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
              onClick={() => onSelect?.(node)}
            >
              {hasChildren && (
                <span className="shrink-0">
                  {node.expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </span>
              )}
              <span className="truncate">{node.label}</span>
            </button>
            {hasChildren && node.expanded && (
              <TreeList
                nodes={node.children!}
                selectedId={selectedId}
                onSelect={onSelect}
                depth={depth + 1}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
```

### useTree Hook

```typescript
import { useState, useCallback } from 'react'

export function useTree(initialNodes: TreeNode[]) {
  const [nodes, setNodes] = useState<TreeNode[]>(initialNodes)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const toggleExpand = useCallback((id: string) => {
    setNodes((prev) => toggleNodeExpand(prev, id))
  }, [])

  const addNode = useCallback((parentId: string | null, label: string) => {
    const newNode: TreeNode = { id: crypto.randomUUID(), label, children: [] }
    if (!parentId) {
      setNodes((prev) => [...prev, newNode])
    } else {
      setNodes((prev) => addChildNode(prev, parentId, newNode))
    }
  }, [])

  const removeNode = useCallback((id: string) => {
    setNodes((prev) => removeTreeNode(prev, id))
  }, [])

  const renameNode = useCallback((id: string, label: string) => {
    setNodes((prev) => updateTreeNode(prev, id, { label }))
  }, [])

  return { nodes, selectedId, setSelectedId, toggleExpand, addNode, removeNode, renameNode }
}

// Helper functions
function toggleNodeExpand(nodes: TreeNode[], id: string): TreeNode[] {
  return nodes.map((node) => {
    if (node.id === id) return { ...node, expanded: !node.expanded }
    if (node.children) return { ...node, children: toggleNodeExpand(node.children, id) }
    return node
  })
}

function addChildNode(nodes: TreeNode[], parentId: string, child: TreeNode): TreeNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children || []), child], expanded: true }
    }
    if (node.children) return { ...node, children: addChildNode(node.children, parentId, child) }
    return node
  })
}

function removeTreeNode(nodes: TreeNode[], id: string): TreeNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => {
      if (node.children) return { ...node, children: removeTreeNode(node.children, id) }
      return node
    })
}

function updateTreeNode(nodes: TreeNode[], id: string, updates: Partial<TreeNode>): TreeNode[] {
  return nodes.map((node) => {
    if (node.id === id) return { ...node, ...updates }
    if (node.children) return { ...node, children: updateTreeNode(node.children, id, updates) }
    return node
  })
}
```

## Checklist

- [ ] ARIA tree role attributes
- [ ] Keyboard navigation (arrow keys, Enter, Space)
- [ ] Recursive rendering with depth tracking
- [ ] Visual indentation per depth level
- [ ] Expand/collapse with chevron icons
- [ ] Named exports with explicit return types
