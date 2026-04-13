# Script Execution Service

Executa scripts de usuario (beforeSave, afterSave, onLoad) em VM Node isolada com timeout de 5s.

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `script-execution-contract.service.ts` | Classe abstrata + tipo ScriptExecutionInput |
| `node-vm-script-execution.service.ts` | Implementacao com Node VM isolada |
| `in-memory-script-execution.service.ts` | Mock para testes |

## Metodos

| Metodo | Retorno | Descricao |
|--------|---------|-----------|
| `execute(input)` | `Promise<ExecutionResult>` | Executa codigo em sandbox com APIs expostas (field, context, email, utils, console) |

## Tipos

- `ScriptExecutionInput` — code, doc, tableSlug, fields (FieldDefinition[]), context (ExecutionContext)
- `ExecutionResult` — success, error?, logs[]
- `ExecutionContext` — action, moment, userId, isNew, table

## Seguranca

- VM Node isolada sem acesso a globals (require, fs, network bloqueados)
- Timeout de 5 segundos
- Validacao de sintaxe antes da execucao

## Registro DI

`injectablesHolder.injectService(ScriptExecutionContractService, NodeVmScriptExecutionService)`
