import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DatabaseIcon, CopyIcon } from 'lucide-react'

export const Route = createFileRoute('/_private/tables/new/')({
  component: RouteComponent,
})

import styles from './new.module.css';

function RouteComponent() {
  const navigate = useNavigate()

  return (
    <div className={`flex h-full items-center justify-center ${styles.hideSearch}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full px-4">

        {/* Criar a partir de modelo */}
        <button
          onClick={() => navigate({ to: '/tables/clone' })}
          className="group flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-background p-10 text-center transition hover:border-primary hover:shadow-lg"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CopyIcon className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">Usar um Modelo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie uma tabela a partir de um modelo existente
            </p>
          </div>
        </button>

        {/* Criar do zero */}
        <button
          onClick={() => navigate({ to: '/tables/create' })}
          className="group flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-background p-10 text-center transition hover:border-primary hover:shadow-lg"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <DatabaseIcon className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">Criar nova Tabela</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Comece com uma tabela totalmente em branco
            </p>
          </div>
        </button>

      </div>
    </div>
  )
}
