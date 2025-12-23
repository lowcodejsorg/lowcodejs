import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InfoIcon } from 'lucide-react';
import type { ITable } from '@/lib/interfaces';

interface CodeEditorInfoModalProps {
  table?: ITable;
  label?: string;
}

export function CodeEditorInfoModal({
  table,
  label = 'Editor JavaScript',
}: CodeEditorInfoModalProps): React.JSX.Element {
  const generateFieldPlaceholders = (): Record<string, string> => {
    if (!table?.fields) return {};

    const placeholders: Record<string, string> = {};
    const tableName =
      table.name?.toLowerCase().replace(/\s+/g, '_') || 'tabela';

    for (const field of table.fields) {
      const fieldName =
        field.name?.toLowerCase().replace(/\s+/g, '_') || 'campo';
      const placeholderName = `${tableName}_${fieldName}`;
      placeholders[placeholderName] = `Valor de ${field.name}`;
    }

    return placeholders;
  };

  const fieldPlaceholders = generateFieldPlaceholders();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0">
          <InfoIcon className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-[85vw] sm:max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tutorial - {label}</DialogTitle>
          <DialogDescription>
            Aprenda como usar o editor JavaScript para automatizar sua tabela
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 text-sm">
          <div>
            <h3 className="font-semibold mb-2">Variáveis Globais Disponíveis:</h3>
            <div className="bg-muted p-3 rounded-md space-y-2">
              <p>
                <code className="bg-background px-1 rounded">userAction</code>:
                Ação atual do usuário
              </p>
              <ul className="ml-4 space-y-1 text-muted-foreground">
                <li>
                  • <code>'novo_registro'</code> - Criando novo registro
                </li>
                <li>
                  • <code>'editar_registro'</code> - Editando registro existente
                </li>
                <li>
                  • <code>'excluir_registro'</code> - Excluindo registro
                </li>
              </ul>
              <p>
                <code className="bg-background px-1 rounded">executionMoment</code>:
                Momento da execução
              </p>
              <ul className="ml-4 space-y-1 text-muted-foreground">
                <li>
                  • <code>'carregamento_formulario'</code> - No carregamento do
                  formulário (OnLoad)
                </li>
                <li>
                  • <code>'antes_salvar'</code> - Antes de salvar o registro
                  (BeforeSave)
                </li>
                <li>
                  • <code>'depois_salvar'</code> - Depois de salvar o registro
                  (AfterSave)
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Funções Disponíveis:</h3>
            <div className="bg-muted p-3 rounded-md space-y-3">
              <div>
                <p>
                  <code className="bg-background px-1 rounded">
                    getFieldValue(fieldId)
                  </code>
                </p>
                <p className="text-muted-foreground ml-4">
                  Obtém valor de um campo do formulário
                </p>
                <p className="ml-4 text-xs">
                  Exemplo: <code>getFieldValue('preco')</code> ou{' '}
                  <code>getFieldValue('$tabela_preco')</code>
                </p>
              </div>
              <div>
                <p>
                  <code className="bg-background px-1 rounded">
                    setFieldValue(fieldId, value)
                  </code>
                </p>
                <p className="text-muted-foreground ml-4">
                  Define valor de um campo do formulário
                </p>
                <p className="ml-4 text-xs">
                  Exemplo: <code>setFieldValue('total', 150.75)</code>
                </p>
              </div>
              <div>
                <p>
                  <code className="bg-background px-1 rounded">
                    sendEmail(emails, subject, body)
                  </code>
                </p>
                <p className="text-muted-foreground ml-4">
                  Envia email com os parâmetros especificados
                </p>
                <p className="ml-4 text-xs">
                  Exemplo:{' '}
                  <code>
                    sendEmail(['admin@site.com'], 'Assunto', 'Corpo do email')
                  </code>
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Referência aos Campos:</h3>
            <div className="bg-muted p-3 rounded-md">
              <p>
                Use o formato:{' '}
                <code className="bg-background px-1 rounded">
                  idTabela_nomeCampo
                </code>
              </p>
              <p className="text-muted-foreground mt-2">Exemplos:</p>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm">
                    Placeholders Dinâmicos (Recomendado):
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Variáveis geradas automaticamente para cada campo
                  </p>
                  <code className="bg-background px-1 rounded text-green-600">
                    $nomeTabela_nomeCampo
                  </code>
                  {table?.fields && table.fields.length > 0 && (
                    <div className="mt-2 border rounded p-2">
                      <p className="text-xs font-medium mb-1">Desta tabela:</p>
                      {Object.keys(fieldPlaceholders).map((placeholder) => (
                        <div key={placeholder} className="text-xs">
                          <code className="text-green-600">{placeholder}</code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-medium text-sm">Método Clássico:</p>
                  <p className="text-xs text-muted-foreground mb-1">
                    Para IDs específicos da tabela
                  </p>
                  <div className="text-xs">
                    <div>
                      • <code>getFieldValue('id_campo')</code>
                    </div>
                    <div>
                      • <code>setFieldValue('id_campo', valor)</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
