import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FIELD_TYPE, type Table } from "@/lib/entity";
import Editor from "@monaco-editor/react";
import { CopyIcon, HexagonIcon, InfoIcon, RefreshCwIcon } from "lucide-react";
import type { editor } from "monaco-editor";
import React from "react";
import { Controller, type Control } from "react-hook-form";
import { toast } from "sonner";

interface CodeEditorProps {
  control: Control<any>;
  name: string;
  defaultValue?: string;
  table?: Table;
  label?: string;
  fileName?: string;
  onRefresh?: () => void;
}

export function CodeEditor({
  control,
  name,
  defaultValue = "",
  table,
  label = "Editor JavaScript",
  fileName = "script.js",
  onRefresh,
}: CodeEditorProps) {
  const editorRef = React.useRef<editor.IStandaloneCodeEditor | null>(null);

  // Gerar placeholders dinâmicos baseados nos campos da tabela
  const generateFieldPlaceholders = React.useMemo(() => {
    if (!table?.fields) return {};

    const placeholders: Record<string, string> = {};
    const tableName =
      table.name?.toLowerCase().replace(/\s+/g, "_") || "tabela";

    for (const field of table.fields) {
      const fieldName =
        field.name?.toLowerCase().replace(/\s+/g, "_") || "campo";
      const placeholderName = `$${tableName}_${fieldName}`;

      // Valor mock baseado no tipo do campo
      let mockValue;
      switch (field.type) {
        case FIELD_TYPE.DATE:
          mockValue = new Date().toISOString();
          break;
        case FIELD_TYPE.TEXT_SHORT:
        case FIELD_TYPE.TEXT_LONG:
          mockValue = `Valor de ${field.name}`;
          break;
        case FIELD_TYPE.DROPDOWN:
          mockValue = field.configuration?.dropdown?.[0] || "Opção 1";
          break;
        case FIELD_TYPE.FILE:
          mockValue = "arquivo.pdf";
          break;
        default:
          mockValue = `Valor de ${field.name}`;
      }

      placeholders[placeholderName] = mockValue;
    }

    return placeholders;
  }, [table]);

  const onMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    toast("Código copiado!", {
      className: "!bg-blue-600 !text-white !border-blue-600",
      descriptionClassName: "!text-white",
      closeButton: true,
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header com informações do arquivo */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
        <div className="flex items-center gap-2 text-sm font-mono font-medium text-muted-foreground">
          <HexagonIcon className="w-4 h-4" />
          {fileName}
        </div>
        <div className="flex items-center gap-1">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
              >
                <InfoIcon className="w-3 h-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="flex flex-col py-4 px-6 gap-5 sm:max-w-[85vw] sm:max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tutorial - {label}</DialogTitle>
                <DialogDescription>
                  Aprenda como usar o editor JavaScript para automatizar sua
                  tabela
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 text-sm">
                <div>
                  <h3 className="font-semibold mb-2">
                    Variáveis Globais Disponíveis:
                  </h3>
                  <div className="bg-muted p-3 rounded-md space-y-2">
                    <p>
                      <code className="bg-background px-1 rounded">
                        userAction
                      </code>
                      : Ação atual do usuário
                    </p>
                    <ul className="ml-4 space-y-1 text-muted-foreground">
                      <li>
                        • <code>'novo_registro'</code> - Criando novo registro
                      </li>
                      <li>
                        • <code>'editar_registro'</code> - Editando registro
                        existente
                      </li>
                      <li>
                        • <code>'excluir_registro'</code> - Excluindo registro
                      </li>
                    </ul>
                    <p>
                      <code className="bg-background px-1 rounded">
                        executionMoment
                      </code>
                      : Momento da execução
                    </p>
                    <ul className="ml-4 space-y-1 text-muted-foreground">
                      <li>
                        • <code>'carregamento_formulario'</code> - No
                        carregamento do formulário (OnLoad)
                      </li>
                      <li>
                        • <code>'antes_salvar'</code> - Antes de salvar o
                        registro (BeforeSave)
                      </li>
                      <li>
                        • <code>'depois_salvar'</code> - Depois de salvar o
                        registro (AfterSave)
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
                        Exemplo: <code>getFieldValue('preco')</code> ou{" "}
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
                        Exemplo:{" "}
                        <code>
                          sendEmail(['admin@site.com'], 'Assunto', 'Corpo do
                          email')
                        </code>
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Referência aos Campos:</h3>
                  <div className="bg-muted p-3 rounded-md">
                    <p>
                      Use o formato:{" "}
                      <code className="bg-background px-1 rounded">
                        idTabela_nomeCampo
                      </code>
                    </p>
                    <p className="text-muted-foreground mt-2">Exemplos:</p>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-sm">
                          🆕 Placeholders Dinâmicos (Recomendado):
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Variáveis geradas automaticamente para cada campo
                        </p>
                        <code className="bg-background px-1 rounded text-green-600">
                          $nomeTabela_nomeCampo
                        </code>
                        {table?.fields && table.fields.length > 0 && (
                          <div className="mt-2 border rounded p-2">
                            <p className="text-xs font-medium mb-1">
                              Desta tabela:
                            </p>
                            {Object.keys(generateFieldPlaceholders).map(
                              (placeholder) => (
                                <div key={placeholder} className="text-xs">
                                  <code className="text-green-600">
                                    {placeholder}
                                  </code>
                                </div>
                              )
                            )}
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
          {onRefresh && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-7 w-7 p-0"
            >
              <RefreshCwIcon className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="h-[400px]">
        <Controller
          control={control}
          name={name}
          render={({ field: { value, onChange } }) => (
            <>
              <div className="flex items-center justify-end px-3 py-1 bg-muted/30 border-b">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(value || "")}
                  className="h-6 text-xs"
                >
                  <CopyIcon className="w-3 h-3 mr-1" />
                  Copiar
                </Button>
              </div>
              <div className="h-[365px]">
                <Editor
                  language="javascript"
                  value={value || defaultValue}
                  onChange={(val) => onChange(val || "")}
                  onMount={onMount}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </>
          )}
        />
      </div>
    </div>
  );
}
