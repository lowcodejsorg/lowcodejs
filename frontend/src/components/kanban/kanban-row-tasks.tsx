import { PlusIcon } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { normalizeRowValue } from '@/lib/kanban-helpers';

export function KanbanRowTasksSection({
  tasks,
  taskTitle,
  onTaskTitleChange,
  onTaskToggle,
  onTaskAdd,
}: {
  tasks: Array<Record<string, any>>;
  taskTitle: string;
  onTaskTitleChange: (value: string) => void;
  onTaskToggle: (index: number) => void;
  onTaskAdd: () => void;
}): React.JSX.Element {
  return (
    <section className="mt-6 space-y-3">
      <h3 className="text-sm font-semibold">Tarefas</h3>
      <div className="space-y-2">
        {tasks.map((task, index) => (
          <div
            key={index}
            className="flex items-start gap-2 rounded-lg border bg-background p-2"
          >
            <Checkbox
              checked={normalizeRowValue(task.realizado).includes('sim')}
              onCheckedChange={() => onTaskToggle(index)}
            />
            <span className="text-sm">{task.titulo || '-'}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={taskTitle}
          onChange={(event) => onTaskTitleChange(event.target.value)}
          placeholder="Nova tarefa"
        />
        <Button
          type="button"
          onClick={onTaskAdd}
          className="cursor-pointer"
        >
          <PlusIcon className="size-4" />
          <span>Adicionar</span>
        </Button>
      </div>
    </section>
  );
}
