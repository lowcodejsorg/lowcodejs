# TODO: Sistema de Métodos JavaScript - Melhorias e Implementações

## Correções Críticas

- Corrigir bug crítico no HandlerFunction
  (server/application/core/util.core.ts:188)
  - [x] Linha 188 está usando afterSave.code no lugar de
        beforeSave.code
  - [x] Testar correção em ambos os cenários (beforeSave e afterSave)
- Expandir contexto do HandlerFunction
  - [x] Adicionar parâmetros: userId, userAction, executionMoment,
        tableId
  - [x] Modificar assinatura da função para receber contexto completo
  - [x] Atualizar todas as chamadas da função

## Variáveis Globais

- Implementar variável userAction
  - [x] Valores: 'novo_registro', 'editar_registro', 'excluir_registro'
  - [x] Injetar no contexto JavaScript executado
  - [x] Integrar com operações CRUD do sistema
- Implementar variável executionMoment
  - [x] Valores: 'carregamento_formulario', 'antes_salvar',
        'depois_salvar'
  - [x] Passar contexto correto em cada momento de execução
- Injetar variáveis globais no HandlerFunction
  - [x] Modificar geração do código JavaScript
  - [x] Declarar variáveis no escopo global do script

## Momentos de Execução

- Adicionar momento onLoad ao modelo
  - [x] Expandir schema Methods em table.model.ts
  - [x] Adicionar campo onLoad: { code: String }
  - [x] Implementar middleware para execução no carregamento
- Implementar execução no frontend
  - [x] Executar scripts onLoad quando formulário carrega (backend)
  - [ ] Integrar com componentes de formulário (frontend)
  - [x] Adicionar tratamento de erros
- Adicionar aba onLoad no dialog de métodos
  - [x] Expandir dialog-table-method/form-table-method.tsx
  - [x] Criar nova aba no Tabs component
  - [x] Implementar editor específico para onLoad

🔧 Funções Utilitárias

- Implementar getFieldValue(fieldId)
  - [x] Função para acessar valores de campos do formulário
  - [x] Suportar formato slugTabela_campo
  - [x] Integrar com sistema de placeholders dinâmicos
- Implementar setFieldValue(fieldId, value)
  - [x] Função para definir valores de campos
  - [x] Validar tipos de dados conforme tipo do campo
  - [ ] Atualizar interface em tempo real
- Implementar sistema de identificação slugTabela_campo
  - [x] Mapear IDs únicos para campos
  - [x] Integrar com sistema atual de placeholders
  - [x] Manter compatibilidade com formato $nomeTabela_nomeCampo
- Implementar sendEmail(emails, subject, body)
  - [x] Configurar sistema de email (SMTP/sendmail)
  - [x] Validar array de emails
  - [x] Implementar rate limiting para prevenir spam
  - [x] Adicionar templates básicos de email

## Melhorias na Interface

- Expandir tutorial do CodeEditor
  - [x] Adicionar exemplos das novas funções
  - [x] Documentar variáveis globais
  - [x] Incluir casos de uso práticos
- Melhorar sistema de placeholders
  - [ ] Auto-complete para funções disponíveis
  - [ ] Validação de sintaxe em tempo real
  - [ ] Highlight de variáveis globais
- Adicionar templates de código
  - [x] Templates para operações comuns
  - [x] Exemplos de cálculos matemáticos
  - [x] Templates para envio de email

🎯 Priorização

Alta Prioridade

- Correção do bug crítico
- Variáveis globais
- Funções getFieldValue/setFieldValue
- Momento onLoad

Média Prioridade

- Sistema de email
- Operações entre tabelas
- Melhorias na interface
