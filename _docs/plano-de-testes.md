# Plano de Testes – LowcodeJS

**Projeto:** LowcodeJS
**Ambiente:** develop
**Versao:** 2.0
**Data de inicio:** 08/03/2026
**Ultima atualizacao:** 30/03/2026
**Responsavel:** Lauriana
**Baseado em:** Documentacao de Software LowcodeJS v2.0

---

## Sumario

1. [Legenda](#1-legenda)
2. [Escopo](#2-escopo)
3. [Criterios de Entrada e Saida](#3-critérios-de-entrada-e-saída)
4. [M01 – Listas (Tabelas)](#4-m01--listas-tabelas)
5. [M02 – Campos](#5-m02--campos)
6. [M03 – Registros (Itens)](#6-m03--registros-itens)
7. [M04 – Permissoes](#7-m04--permissões)
8. [M05 – Visibilidade](#8-m05--visibilidade)
9. [M06 – Grupo de Campos](#9-m06--grupo-de-campos)
10. [M07 – Autenticacao](#10-m07--autenticação)
11. [M08 – Modelos de Visualizacao](#11-m08--modelos-de-visualização)
12. [M09 – Gestao de Menus](#12-m09--gestão-de-menus)
13. [M10 – Clonagem de Tabelas](#13-m10--clonagem-de-tabelas)
14. [M11 – Configuracoes do Sistema](#14-m11--configurações-do-sistema)
15. [M12 – Performance](#15-m12--performance)
16. [M13 – Seguranca](#16-m13--segurança)
17. [M14 – Dashboard](#17-m14--dashboard)
18. [M15 – Chat IA](#18-m15--chat-ia)
19. [M16 – Forum](#19-m16--fórum)
20. [M17 – Paginas Customizadas](#20-m17--páginas-customizadas)
21. [M18 – Import/Export](#21-m18--importexport)
22. [M19 – Perfil](#22-m19--perfil)
23. [M20 – Scripts/Sandbox](#23-m20--scriptssandbox)
24. [M21 – Storage](#24-m21--storage)
25. [Testes de Regressao](#25-testes-de-regressão)
26. [Testes de Interface e Compatibilidade](#26-testes-de-interface-e-compatibilidade)
27. [Resumo de Pendencias Conhecidas](#27-resumo-de-pendências-conhecidas)
28. [Backlog de Bugs e Ajustes](#28-backlog-de-bugs-e-ajustes)
29. [Backlog de Melhorias](#29-backlog-de-melhorias)
30. [Itens Resolvidos](#30-itens-resolvidos)

---

## 1. Legenda

| Simbolo | Status                                                                           |
| ------- | -------------------------------------------------------------------------------- |
| ✅      | Passou no teste                                                                  |
| ❌      | Erro — requisito nao funciona ou apresenta tela de erro                          |
| ⚠️      | Ajuste — funcionalidade precisa de pequena correcao, sem erro visivel ao usuario |
| 🔁      | Aguardando correcao e reteste                                                    |
| 🆕      | Melhoria — nova funcionalidade sugerida                                          |
| ❓      | Nao confirmado ou descartado                                                     |
| ⏭️      | Nao testado ainda                                                                |

**Tipo de teste:**

| Sigla | Tipo                    |
| ----- | ----------------------- |
| FUN   | Funcional               |
| VAL   | Validacao               |
| NEG   | Negativo / Caso de erro |
| INT   | Integracao              |
| PER   | Performance             |
| SEG   | Seguranca               |
| USA   | Usabilidade             |
| REG   | Regressao               |

---

## 2. Escopo

### Dentro do escopo

- Todos os modulos funcionais: Listas, Campos, Registros, Permissoes, Visibilidade, Grupo de Campos, Autenticacao, Modelos de Visualizacao (9 modelos), Menus, Clonagem, Configuracoes
- Novos modulos: Dashboard, Chat IA, Forum, Paginas Customizadas, Import/Export, Perfil, Scripts/Sandbox, Storage
- Testes de performance com volumes de 100k, 1M e 10M de registros
- Testes de seguranca basicos: autenticacao JWT RS256, rotas protegidas, CORS, sandbox
- Compatibilidade com os principais navegadores modernos

### Fora do escopo

- Testes de integracao com sistemas externos nao documentados
- Testes de acessibilidade (WCAG)
- Testes em dispositivos moveis nativos

---

## 3. Criterios de Entrada e Saida

### Criterios de entrada (para iniciar os testes)

- Ambiente `develop` disponivel e acessivel
- Build da versao a ser testada implantado
- Dados de teste criados (usuario master, usuario comum, grupos de exemplo)
- Documentacao de software versao 2.0 disponivel

### Criterios de saida (para encerrar os testes)

- Todos os casos de teste executados (sem ⏭️)
- Todos os bugs criticos (❌) registrados com evidencia
- Retestes realizados para correcoes entregues
- Relatorio final preenchido

---

## 4. M01 – Listas (Tabelas)

### 4.1 Exibicao de Listas

| ID     | Tipo | Caso de Teste                              | Resultado Esperado                                                | Status |
| ------ | ---- | ------------------------------------------ | ----------------------------------------------------------------- | ------ |
| TC-001 | FUN  | Acessar o modulo de Listas                 | Listas exibidas em modo lista, paginadas                          | ⏭️     |
| TC-002 | FUN  | Verificar colunas da listagem              | Exibe: nome, link, visibilidade, data de criacao e criado por     | ⏭️     |
| TC-003 | FUN  | Alterar quantidade de registros por pagina | Lista recarrega com a nova quantidade configurada                 | ⏭️     |
| TC-004 | FUN  | Navegar entre paginas da listagem          | Registros da pagina seguinte/anterior sao carregados corretamente | ⏭️     |
| TC-005 | FUN  | Clicar no link de uma tabela               | Link e copiado automaticamente para a area de transferencia       | ⏭️     |
| TC-006 | FUN  | Verificar menu de acoes de uma lista       | Deve conter: compartilhar link, exportar, excluir e visualizar    | ⏭️     |
| TC-007 | USA  | Verificar ortografia do menu de acoes      | Deve aparecer "Acoes" (com acento correto)                        | ⏭️     |

### 4.2 Busca de Listas

| ID     | Tipo | Caso de Teste                                        | Resultado Esperado                                           | Status |
| ------ | ---- | ---------------------------------------------------- | ------------------------------------------------------------ | ------ |
| TC-008 | FUN  | Buscar lista por nome exato                          | Lista correspondente e exibida                               | ⏭️     |
| TC-009 | FUN  | Buscar com letras maiusculas e minusculas mistas     | Sistema encontra a lista sem distincao de caixa              | ⏭️     |
| TC-010 | FUN  | Buscar com e sem acentuacao                          | Sistema encontra a lista ignorando acentos                   | ⏭️     |
| TC-011 | FUN  | Buscar por parte do nome (busca parcial)             | Listas com o trecho no nome sao exibidas                     | ⏭️     |
| TC-012 | FUN  | Buscar com caracteres especiais (`@`, `-`, `_`, `.`) | Sistema lida com os caracteres sem erro                      | ⏭️     |
| TC-013 | FUN  | Buscar lista que esta em outra pagina                | Lista e encontrada independentemente da pagina em que esta   | ⏭️     |
| TC-014 | NEG  | Buscar por nome inexistente                          | Sistema exibe mensagem indicando nenhum resultado encontrado | ⏭️     |
| TC-015 | NEG  | Limpar o campo de busca                              | Listagem completa e restaurada                               | ⏭️     |

### 4.3 Criacao de Lista

| ID     | Tipo | Caso de Teste                                              | Resultado Esperado                                    | Status |
| ------ | ---- | ---------------------------------------------------------- | ----------------------------------------------------- | ------ |
| TC-016 | FUN  | Criar lista com nome e descricao validos                   | Lista criada e exibida na listagem                    | ⏭️     |
| TC-017 | VAL  | Criar lista com nome de 40 caracteres (limite maximo)      | Lista criada com sucesso                              | ⏭️     |
| TC-018 | NEG  | Criar lista com nome de 41 caracteres ou mais              | Sistema bloqueia e exibe mensagem de limite           | ⏭️     |
| TC-019 | NEG  | Criar lista com nome vazio                                 | Sistema exibe erro "Campo obrigatorio"                | ⏭️     |
| TC-020 | NEG  | Criar lista com nome duplicado                             | Sistema rejeita e exibe mensagem de nome ja existente | ⏭️     |
| TC-021 | VAL  | Criar lista com caracteres especiais no nome               | Lista criada corretamente                             | ⏭️     |
| TC-022 | FUN  | Cancelar criacao de lista                                  | Modal/formulario fecha sem criar lista                | ⏭️     |
| TC-023 | USA  | Verificar se toda a interface de criacao esta em portugues | Todos os textos, labels e botoes em PT-BR             | ⏭️     |

### 4.4 Edicao de Lista

| ID     | Tipo | Caso de Teste                         | Resultado Esperado                          | Status |
| ------ | ---- | ------------------------------------- | ------------------------------------------- | ------ |
| TC-024 | FUN  | Editar nome de uma lista              | Nome atualizado na listagem e na tabela     | ⏭️     |
| TC-025 | FUN  | Editar descricao de uma lista         | Descricao atualizada corretamente           | ⏭️     |
| TC-026 | NEG  | Editar nome para um nome ja existente | Sistema rejeita com mensagem de duplicidade | ⏭️     |
| TC-027 | NEG  | Editar nome para vazio                | Sistema exibe erro de campo obrigatorio     | ⏭️     |

### 4.5 Visibilidade, Colaboracao, Lixeira e Exclusao

| ID     | Tipo | Caso de Teste                                           | Resultado Esperado                                      | Status |
| ------ | ---- | ------------------------------------------------------- | ------------------------------------------------------- | ------ |
| TC-028 | FUN  | Alterar visibilidade para PUBLIC                        | Visibilidade atualizada na listagem                     | ⏭️     |
| TC-029 | FUN  | Alterar visibilidade para RESTRICTED                    | Visibilidade atualizada na listagem                     | ⏭️     |
| TC-030 | FUN  | Alterar visibilidade para OPEN                          | Visibilidade atualizada na listagem                     | ⏭️     |
| TC-031 | FUN  | Alterar visibilidade para FORM                          | Visibilidade atualizada na listagem                     | ⏭️     |
| TC-032 | FUN  | Alterar visibilidade para PRIVATE                       | Visibilidade atualizada na listagem                     | ⏭️     |
| TC-033 | FUN  | Alterar colaboracao para OPEN                           | Modo de colaboracao atualizado                          | ⏭️     |
| TC-034 | FUN  | Alterar colaboracao para RESTRICTED                     | Modo de colaboracao atualizado                          | ⏭️     |
| TC-035 | FUN  | Alterar estilo de visualizacao (9 estilos)              | Estilo atualizado e renderizado corretamente            | ⏭️     |
| TC-036 | FUN  | Enviar lista para a lixeira                             | Lista sai da listagem principal e aparece na lixeira    | ⏭️     |
| TC-037 | FUN  | Restaurar lista da lixeira                              | Lista retorna a listagem principal                      | ⏭️     |
| TC-038 | FUN  | Excluir lista permanentemente da lixeira                | Lista nao aparece mais em lugar nenhum                  | ⏭️     |
| TC-039 | INT  | Verificar exclusao de grupos de campos ao excluir lista | Grupos de campos associados sao removidos corretamente  | ⏭️     |
| TC-040 | INT  | Verificar exclusao de relacionamentos ao excluir lista  | Relacionamentos sao removidos sem quebrar outras listas | ⏭️     |

---

## 5. M02 – Campos

### 5.1 Operacoes Gerais de Campos

| ID     | Tipo | Caso de Teste                                     | Resultado Esperado                                                        | Status |
| ------ | ---- | ------------------------------------------------- | ------------------------------------------------------------------------- | ------ |
| TC-041 | FUN  | Criar campo em uma lista                          | Campo criado e exibido na estrutura da lista                              | ⏭️     |
| TC-042 | FUN  | Editar campo existente                            | Alteracoes salvas e refletidas na lista                                   | ⏭️     |
| TC-043 | FUN  | Enviar campo para lixeira (soft delete)           | Campo removido da estrutura ativa                                         | ⏭️     |
| TC-044 | FUN  | Restaurar campo da lixeira                        | Campo retorna a estrutura da lista                                        | ⏭️     |
| TC-045 | FUN  | Excluir campo permanentemente (hard delete)       | Campo removido definitivamente                                            | ⏭️     |
| TC-046 | FUN  | Marcar campo como obrigatorio                     | Icone de obrigatorio exibido; criacao de registro sem o campo e bloqueada | ⏭️     |
| TC-047 | FUN  | Desmarcar obrigatoriedade de campo                | Campo passa a ser opcional                                                | ⏭️     |
| TC-048 | FUN  | Alterar ordem dos campos                          | Campos reordenados conforme definido                                      | ⏭️     |
| TC-049 | FUN  | Ativar campo para uso em filtro (showInFilter)    | Campo aparece nas opcoes de filtro                                        | ⏭️     |
| TC-050 | FUN  | Ativar exibicao do campo na lista (showInList)    | Campo aparece como coluna na listagem                                     | ⏭️     |
| TC-051 | FUN  | Desativar exibicao do campo na lista              | Campo nao aparece mais como coluna                                        | ⏭️     |
| TC-052 | FUN  | Ativar exibicao no formulario (showInForm)        | Campo aparece no formulario de criacao/edicao                             | ⏭️     |
| TC-053 | FUN  | Ativar exibicao no detalhe (showInDetail)         | Campo aparece na visualizacao detalhada do registro                       | ⏭️     |
| TC-054 | FUN  | Configurar largura do campo (widthInList/Form)    | Largura aplicada conforme configurado                                     | ⏭️     |
| TC-055 | USA  | Verificar apresentacao visual do campo na lista   | Sem bugs de layout ou sobreposicao                                        | ⏭️     |
| TC-056 | FUN  | Verificar campos nativos automaticos              | 5 campos nativos presentes (CREATOR, IDENTIFIER, CREATED_AT, TRASHED, TRASHED_AT) | ⏭️     |

### 5.2 Campo Texto Curto (TEXT_SHORT)

| ID     | Tipo | Caso de Teste                                  | Resultado Esperado                                       | Status |
| ------ | ---- | ---------------------------------------------- | -------------------------------------------------------- | ------ |
| TC-057 | FUN  | Criar campo TEXT_SHORT formato ALPHA_NUMERIC   | Campo aceita texto livre                                 | ⏭️     |
| TC-058 | FUN  | Criar campo TEXT_SHORT formato URL             | Campo aceita URLs validas                                | ⏭️     |
| TC-059 | USA  | Verificar truncamento de URL longa na listagem | URL exibida com "..." ao ultrapassar o espaco disponivel | ⏭️     |
| TC-060 | FUN  | Criar campo TEXT_SHORT formato EMAIL           | Campo aceita e valida formato de email                   | ⏭️     |
| TC-061 | FUN  | Criar campo TEXT_SHORT formato PHONE           | Campo aceita formato de telefone valido                  | ⏭️     |
| TC-062 | FUN  | Criar campo TEXT_SHORT formato CPF             | Campo valida e aceita CPF com formato correto            | ⏭️     |
| TC-063 | NEG  | Inserir CPF invalido                           | Sistema exibe erro de validacao                          | ⏭️     |
| TC-064 | FUN  | Criar campo TEXT_SHORT formato CNPJ            | Campo valida e aceita CNPJ com formato correto           | ⏭️     |
| TC-065 | NEG  | Inserir CNPJ invalido                          | Sistema exibe erro de validacao                          | ⏭️     |
| TC-066 | FUN  | Criar campo TEXT_SHORT formato INTEGER         | Campo aceita apenas numeros inteiros                     | ⏭️     |
| TC-067 | FUN  | Criar campo TEXT_SHORT formato DECIMAL         | Campo aceita numeros decimais                            | ⏭️     |
| TC-068 | FUN  | Criar campo PASSWORD                           | Campo oculta o valor digitado por padrao                 | ⏭️     |
| TC-069 | FUN  | Usar botao mostrar/ocultar senha               | Valor alterna entre oculto e visivel                     | ⏭️     |
| TC-070 | REG  | Editar registro com campo Password preenchido  | Valor da senha e preservado apos a edicao                | ⏭️     |

### 5.3 Campo Texto Longo (TEXT_LONG)

| ID     | Tipo | Caso de Teste                            | Resultado Esperado                                                       | Status |
| ------ | ---- | ---------------------------------------- | ------------------------------------------------------------------------ | ------ |
| TC-071 | FUN  | Criar campo TEXT_LONG formato PLAIN_TEXT | Campo aceita texto em multiplas linhas                                   | ⏭️     |
| TC-072 | FUN  | Criar campo TEXT_LONG formato RICH_TEXT  | Campo abre editor Tiptap WYSIWYG                                        | ⏭️     |
| TC-073 | FUN  | Formatar texto no editor WYSIWYG         | Negrito, italico, listas, links, tabelas, imagens                        | ⏭️     |
| TC-074 | FUN  | Visualizar registro com campo RICH_TEXT  | Conteudo e renderizado como HTML formatado                               | ⏭️     |

### 5.4 Campo Data (DATE)

| ID     | Tipo | Caso de Teste                                   | Resultado Esperado                                | Status |
| ------ | ---- | ----------------------------------------------- | ------------------------------------------------- | ------ |
| TC-075 | FUN  | Inserir data valida                             | Data salva e exibida corretamente                 | ⏭️     |
| TC-076 | NEG  | Inserir data invalida (ex.: 31/02/2026)         | Sistema exibe erro de validacao                   | ⏭️     |
| TC-077 | NEG  | Inserir data fora do intervalo configurado      | Sistema bloqueia e informa o intervalo permitido  | ⏭️     |
| TC-078 | FUN  | Ordenar registros por campo Data                | Registros ordenados cronologicamente (ASC e DESC) | ⏭️     |
| TC-079 | FUN  | Filtrar registros por periodo usando campo Data | Apenas registros do periodo sao exibidos          | ⏭️     |
| TC-080 | FUN  | Editar valor de campo Data em um registro       | Novo valor salvo e exibido corretamente           | ⏭️     |
| TC-081 | FUN  | Testar formatos DD/MM/YYYY, YYYY-MM-DD etc.    | Data exibida conforme formato configurado         | ⏭️     |
| TC-082 | FUN  | Testar formatos com hora (HH:MM:SS)             | Data e hora salvas e exibidas corretamente        | ⏭️     |

### 5.5 Campo Arquivo (FILE)

| ID     | Tipo | Caso de Teste                             | Resultado Esperado                                     | Status |
| ------ | ---- | ----------------------------------------- | ------------------------------------------------------ | ------ |
| TC-083 | FUN  | Fazer upload de um arquivo valido         | Arquivo salvo e exibido no registro                    | ⏭️     |
| TC-084 | FUN  | Fazer upload de multiplos arquivos        | Todos os arquivos salvos e listados corretamente       | ⏭️     |
| TC-085 | NEG  | Fazer upload de arquivo com tipo invalido | Sistema rejeita e exibe mensagem de tipo nao permitido | ⏭️     |
| TC-086 | NEG  | Fazer upload de arquivo muito grande      | Sistema rejeita e informa o tamanho maximo permitido   | ⏭️     |
| TC-087 | FUN  | Visualizar arquivo na listagem            | Arquivo exibido como link ou icone na coluna           | ⏭️     |
| TC-088 | FUN  | Visualizar arquivo no detalhe do registro | Arquivo acessivel/visualizavel dentro do registro      | ⏭️     |
| TC-089 | NEG  | Fazer upload duplicado do mesmo arquivo   | Sistema trata duplicidade sem erro critico             | ⏭️     |

### 5.6 Campo Dropdown

| ID     | Tipo | Caso de Teste                             | Resultado Esperado                                      | Status |
| ------ | ---- | ----------------------------------------- | ------------------------------------------------------- | ------ |
| TC-090 | FUN  | Criar campo Dropdown com uma opcao        | Opcao disponivel na selecao                             | ⏭️     |
| TC-091 | FUN  | Criar campo Dropdown com multiplas opcoes | Todas as opcoes disponiveis                             | ⏭️     |
| TC-092 | FUN  | Ordenar opcoes do Dropdown                | Opcoes reordenadas conforme definido                    | ⏭️     |
| TC-093 | FUN  | Editar opcoes do Dropdown                 | Alteracoes refletidas no campo                          | ⏭️     |
| TC-094 | VAL  | Usar Dropdown como campo obrigatorio      | Criacao de registro sem selecao e bloqueada             | ⏭️     |
| TC-095 | FUN  | Usar campo Dropdown em filtro             | Registros filtrados corretamente pela opcao selecionada | ⏭️     |
| TC-096 | FUN  | Configurar cores nas opcoes do Dropdown   | Cores exibidas conforme configurado                     | ⏭️     |

### 5.7 Campo Relacionamento (RELATIONSHIP)

| ID     | Tipo | Caso de Teste                               | Resultado Esperado                                      | Status |
| ------ | ---- | ------------------------------------------- | ------------------------------------------------------- | ------ |
| TC-097 | FUN  | Criar relacionamento entre duas tabelas     | Campo vincula registros da tabela relacionada           | ⏭️     |
| TC-098 | FUN  | Adicionar item relacionado a um registro    | Item aparece vinculado corretamente                     | ⏭️     |
| TC-099 | FUN  | Remover item relacionado de um registro     | Vinculo removido sem afetar o registro original         | ⏭️     |
| TC-100 | FUN  | Consultar registros por relacionamento      | Filtro por relacionamento retorna registros corretos    | ⏭️     |
| TC-101 | FUN  | Configurar campo de exibicao e ordenacao    | Registros relacionados exibidos conforme configuracao   | ⏭️     |

### 5.8 Campo Categoria (CATEGORY)

| ID     | Tipo | Caso de Teste                                     | Resultado Esperado                                       | Status |
| ------ | ---- | ------------------------------------------------- | -------------------------------------------------------- | ------ |
| TC-102 | FUN  | Criar campo CATEGORY com estrutura hierarquica    | Nos pai e filho criados e exibidos corretamente          | ⏭️     |
| TC-103 | FUN  | Selecionar item da arvore em um registro          | Item selecionado e salvo no registro                     | ⏭️     |
| TC-104 | FUN  | Editar item da arvore                             | Alteracao refletida em todos os registros que o utilizam | ⏭️     |
| TC-105 | FUN  | Adicionar nos filhos na arvore                    | Nos adicionados corretamente na hierarquia               | ⏭️     |
| TC-106 | FUN  | Usar campo CATEGORY em filtro                     | Registros filtrados corretamente pelo no selecionado     | ⏭️     |
| TC-107 | FUN  | Adicionar categorias via endpoint add-category    | Categorias adicionadas ao campo                          | ⏭️     |

### 5.9 Campo Avaliacao (EVALUATION)

| ID     | Tipo | Caso de Teste                                              | Resultado Esperado                         | Status |
| ------ | ---- | ---------------------------------------------------------- | ------------------------------------------ | ------ |
| TC-108 | FUN  | Inserir avaliacao numerica em um registro                  | Avaliacao salva e exibida                  | ⏭️     |
| TC-109 | FUN  | Alterar avaliacao ja inserida                              | Nova avaliacao sobrepoe a anterior         | ⏭️     |
| TC-110 | FUN  | Configurar campo como voto restrito                        | Apenas usuarios autenticados podem avaliar | ⏭️     |
| TC-111 | FUN  | Configurar campo como voto publico                         | Usuarios nao autenticados podem avaliar    | ⏭️     |
| TC-112 | USA  | Verificar se termos do campo Avaliacao estao em portugues  | Sem termos em ingles na interface          | ⏭️     |

### 5.10 Campo Reacao (REACTION)

| ID     | Tipo | Caso de Teste                                  | Resultado Esperado                                 | Status |
| ------ | ---- | ---------------------------------------------- | -------------------------------------------------- | ------ |
| TC-113 | FUN  | Adicionar like em um registro                  | Reacao LIKE registrada e contagem atualizada       | ⏭️     |
| TC-114 | FUN  | Remover like (unlike) de um registro           | Reacao removida e contagem atualizada              | ⏭️     |
| TC-115 | FUN  | Verificar que cada usuario pode reagir uma vez | Segundo like do mesmo usuario alterna para unlike  | ⏭️     |
| TC-116 | SEG  | Verificar restricao por autenticacao           | Usuarios nao autenticados nao podem reagir         | ⏭️     |

### 5.11 Campo Usuario (USER)

| ID     | Tipo | Caso de Teste                                | Resultado Esperado                                 | Status |
| ------ | ---- | -------------------------------------------- | -------------------------------------------------- | ------ |
| TC-117 | FUN  | Criar campo USER e selecionar usuario        | Usuario selecionado e salvo no registro            | ⏭️     |
| TC-118 | FUN  | Exibir nome do usuario no registro e listagem | Nome exibido corretamente                         | ⏭️     |
| TC-119 | FUN  | Usar campo USER em filtro                    | Registros filtrados pelo usuario selecionado       | ⏭️     |

### 5.12 Campo Grupo de Campos (FIELD_GROUP)

| ID     | Tipo | Caso de Teste                                       | Resultado Esperado                                   | Status |
| ------ | ---- | --------------------------------------------------- | ---------------------------------------------------- | ------ |
| TC-120 | FUN  | Criar campo FIELD_GROUP (sub-tabela)                | Grupo criado com campos internos                     | ⏭️     |
| TC-121 | FUN  | Adicionar linha dentro do grupo                     | Linha criada e exibida na sub-tabela                 | ⏭️     |
| TC-122 | FUN  | Editar linha dentro do grupo                        | Dados atualizados corretamente                       | ⏭️     |
| TC-123 | FUN  | Excluir linha dentro do grupo                       | Linha removida da sub-tabela                         | ⏭️     |
| TC-124 | FUN  | Exibicao do grupo no formulario do registro         | Sub-tabela renderizada corretamente                  | ⏭️     |

---

## 6. M03 – Registros (Itens)

| ID     | Tipo | Caso de Teste                                        | Resultado Esperado                                         | Status |
| ------ | ---- | ---------------------------------------------------- | ---------------------------------------------------------- | ------ |
| TC-125 | FUN  | Criar registro com todos os campos preenchidos       | Registro salvo e exibido na listagem                       | ⏭️     |
| TC-126 | FUN  | Criar registro com campos opcionais vazios           | Registro salvo sem erros                                   | ⏭️     |
| TC-127 | NEG  | Criar registro com campo obrigatorio vazio           | Sistema bloqueia e destaca o campo com erro                | ⏭️     |
| TC-128 | FUN  | Editar registro existente                            | Dados atualizados corretamente na listagem e no detalhe    | ⏭️     |
| TC-129 | FUN  | Enviar registro para lixeira (soft delete)           | Registro removido da listagem ativa                        | ⏭️     |
| TC-130 | FUN  | Restaurar registro da lixeira                        | Registro retorna a listagem ativa                          | ⏭️     |
| TC-131 | FUN  | Excluir registro permanentemente (hard delete)       | Registro removido definitivamente                          | ⏭️     |
| TC-132 | FUN  | Ordenar registros por coluna (ASC)                   | Registros exibidos em ordem crescente                      | ⏭️     |
| TC-133 | FUN  | Ordenar registros por coluna (DESC)                  | Registros exibidos em ordem decrescente                    | ⏭️     |
| TC-134 | FUN  | Filtrar registros por campo                          | Apenas registros com o valor filtrado sao exibidos         | ⏭️     |
| TC-135 | FUN  | Buscar registros por texto                           | Registros correspondentes ao texto sao exibidos            | ⏭️     |
| TC-136 | FUN  | Verificar atualizacao imediata apos edicao           | Listagem reflete a alteracao sem necessidade de recarregar | ⏭️     |
| TC-137 | NEG  | Remover filtro e verificar retorno dos registros     | Listagem volta a exibir todos os registros                 | ⏭️     |
| TC-138 | FUN  | Enviar multiplos registros para lixeira (bulk trash) | Todos os registros selecionados enviados para lixeira      | ⏭️     |
| TC-139 | FUN  | Restaurar multiplos registros (bulk restore)         | Todos os registros selecionados restaurados                | ⏭️     |

---

## 7. M04 – Permissoes

### 7.1 Usuarios

| ID     | Tipo | Caso de Teste                                              | Resultado Esperado                                     | Status |
| ------ | ---- | ---------------------------------------------------------- | ------------------------------------------------------ | ------ |
| TC-140 | FUN  | Criar novo usuario                                         | Usuario cadastrado e exibido na listagem               | ⏭️     |
| TC-141 | FUN  | Editar dados do usuario (nome, email)                      | Dados atualizados corretamente                         | ⏭️     |
| TC-142 | FUN  | Alterar senha de um usuario pelo administrador             | Senha atualizada com sucesso                           | ⏭️     |
| TC-143 | SEG  | Verificar se sessao ativa e invalidada apos troca de senha | Usuario perde o acesso e precisa fazer login novamente | ⏭️     |
| TC-144 | FUN  | Alterar status de usuario para INACTIVE                    | Usuario nao consegue mais logar                        | ⏭️     |
| TC-145 | FUN  | Reativar usuario (status ACTIVE)                           | Usuario volta a conseguir logar                        | ⏭️     |
| TC-146 | FUN  | Verificar exibicao do usuario logado na interface          | Nome/avatar do usuario logado visivel no sistema       | ⏭️     |
| TC-147 | FUN  | Alterar propria senha como usuario comum                   | Senha alterada com sucesso                             | ⏭️     |

### 7.2 Grupos

| ID     | Tipo | Caso de Teste                                 | Resultado Esperado                                           | Status |
| ------ | ---- | --------------------------------------------- | ------------------------------------------------------------ | ------ |
| TC-148 | FUN  | Criar grupo de permissao                      | Grupo criado e disponivel para associacao                    | ⏭️     |
| TC-149 | FUN  | Editar grupo e suas permissoes (12 permissoes) | Permissoes atualizadas e aplicadas imediatamente             | ⏭️     |
| TC-150 | FUN  | Excluir grupo de permissao                    | Grupo removido sem afetar usuarios associados (ou com aviso) | ⏭️     |
| TC-151 | INT  | Associar usuario a grupo                      | Usuario herda as permissoes do grupo                         | ⏭️     |
| TC-152 | INT  | Remover usuario de grupo                      | Usuario perde as permissoes do grupo removido                | ⏭️     |

### 7.3 Roles (RBAC)

| ID     | Tipo | Caso de Teste                                     | Resultado Esperado                                       | Status |
| ------ | ---- | ------------------------------------------------- | -------------------------------------------------------- | ------ |
| TC-153 | SEG  | MASTER acessa todas as funcionalidades            | Nenhuma restricao de acesso                              | ⏭️     |
| TC-154 | SEG  | ADMINISTRATOR acessa todas as tabelas             | Acesso total a tabelas, sem acesso a settings/dashboard  | ⏭️     |
| TC-155 | SEG  | MANAGER faz CRUD respeitando ownership            | Pode operar apenas em tabelas que e dono                 | ⏭️     |
| TC-156 | SEG  | REGISTERED pode apenas VIEW + CREATE_ROW          | Outras operacoes sao bloqueadas                          | ⏭️     |

---

## 8. M05 – Visibilidade

| ID     | Tipo | Caso de Teste                                        | Resultado Esperado                                     | Status |
| ------ | ---- | ---------------------------------------------------- | ------------------------------------------------------ | ------ |
| TC-157 | FUN  | Acessar lista PUBLIC sem login                       | Lista carregada corretamente, somente visualizacao     | ⏭️     |
| TC-158 | FUN  | Acessar lista FORM sem login                         | Formulario de criacao de registro disponivel           | ⏭️     |
| TC-159 | FUN  | Acessar lista OPEN sem login                         | VIEW + criacao de registro disponiveis                 | ⏭️     |
| TC-160 | FUN  | Acessar lista RESTRICTED sem login                   | Sistema redireciona para tela de login                 | ⏭️     |
| TC-161 | FUN  | Acessar lista RESTRICTED com login valido            | Lista carregada, somente VIEW para nao-owners          | ⏭️     |
| TC-162 | FUN  | Acessar lista PRIVATE sem ser owner                  | Sistema exibe mensagem de acesso negado                | ⏭️     |
| TC-163 | FUN  | Acessar lista RESTRICTED com perfil sem permissao    | Sistema exibe mensagem de acesso negado                | ⏭️     |
| TC-164 | FUN  | Acessar lista RESTRICTED com perfil com permissao    | Lista carregada normalmente                            | ⏭️     |
| TC-165 | FUN  | Modo colaboracao OPEN — usuario comum edita registro | Edicao permitida                                       | ⏭️     |
| TC-166 | FUN  | Modo colaboracao RESTRICTED — usuario comum edita    | Edicao bloqueada para nao-owners                       | ⏭️     |

---

## 9. M06 – Grupo de Campos

| ID     | Tipo | Caso de Teste                                       | Resultado Esperado                                        | Status |
| ------ | ---- | --------------------------------------------------- | --------------------------------------------------------- | ------ |
| TC-167 | FUN  | Criar grupo de campos e vincula-lo a uma lista      | Grupo criado e exibido na estrutura da lista              | ⏭️     |
| TC-168 | FUN  | Adicionar campos ao grupo                           | Campos associados ao grupo corretamente                   | ⏭️     |
| TC-169 | FUN  | Editar nome do grupo de campos                      | Nome atualizado tanto no banco quanto na interface        | ⏭️     |
| TC-170 | REG  | Editar apenas os campos do grupo (sem alterar nome) | Sistema salva e exibe corretamente                        | ⏭️     |
| TC-171 | FUN  | Excluir grupo de campos (enviar para lixeira)       | Grupo removido da listagem ativa                          | ⏭️     |
| TC-172 | FUN  | Restaurar grupo de campos da lixeira                | Grupo volta com seus campos associados                    | ⏭️     |
| TC-173 | FUN  | Criar novo campo dentro de um grupo                 | Campo adicionado ao grupo corretamente                    | ⏭️     |
| TC-174 | FUN  | Filtrar registros por grupo de campos               | Apenas campos do grupo selecionado sao exibidos no filtro | ⏭️     |
| TC-175 | FUN  | Visualizar grupo de campos em um registro aberto    | Campos organizados por grupo na visualizacao              | ⏭️     |
| TC-176 | FUN  | CRUD de linhas dentro de grupo (group-rows)         | Criar, listar, editar e excluir linhas no grupo           | ⏭️     |

---

## 10. M07 – Autenticacao

| ID     | Tipo | Caso de Teste                                    | Resultado Esperado                                       | Status |
| ------ | ---- | ------------------------------------------------ | -------------------------------------------------------- | ------ |
| TC-177 | FUN  | Login com credenciais validas                    | Usuario autenticado e redirecionado a rota padrao do role | ⏭️     |
| TC-178 | NEG  | Login com senha incorreta                        | Mensagem de erro exibida, sem autenticacao               | ⏭️     |
| TC-179 | NEG  | Login com email incorreto                        | Mensagem de erro exibida, sem autenticacao               | ⏭️     |
| TC-180 | NEG  | Login com campo de email vazio                   | Validacao impede o envio do formulario                   | ⏭️     |
| TC-181 | NEG  | Login com campo de senha vazio                   | Validacao impede o envio do formulario                   | ⏭️     |
| TC-182 | VAL  | Login com espacos extras no inicio/fim do email  | Sistema ignora os espacos e autentica corretamente       | ⏭️     |
| TC-183 | FUN  | Logout                                           | Sessao encerrada e usuario redirecionado ao login        | ⏭️     |
| TC-184 | FUN  | Recuperacao de senha via email                   | Email de redefinicao enviado; link funciona corretamente | ⏭️     |
| TC-185 | NEG  | Usar link de recuperacao expirado                | Sistema informa que o link nao e mais valido             | ⏭️     |
| TC-186 | FUN  | Login simultaneo em dois dispositivos diferentes | Ambas as sessoes funcionam independentemente             | ⏭️     |
| TC-187 | FUN  | Verificar redirecionamento pos-login             | Usuario vai para rota padrao do seu role                 | ⏭️     |
| TC-188 | FUN  | Cadastro de nova conta (sign-up)                 | Usuario criado e redirecionado ao login                  | ⏭️     |
| TC-189 | NEG  | Sign-up com email ja existente                   | Sistema rejeita com mensagem de email duplicado          | ⏭️     |
| TC-190 | FUN  | Login via magic link                             | Email enviado com link; click autentica o usuario        | ⏭️     |
| TC-191 | FUN  | Refresh token — renovacao automatica de sessao   | Token renovado sem interrupcao para o usuario            | ⏭️     |
| TC-192 | NEG  | Enviar refresh token expirado                    | Sistema rejeita e solicita novo login                    | ⏭️     |
| TC-193 | FUN  | Solicitar codigo de validacao (request-code)     | Codigo enviado por email                                 | ⏭️     |
| TC-194 | FUN  | Validar codigo (validate-code)                   | Codigo aceito e acao permitida                           | ⏭️     |
| TC-195 | NEG  | Validar codigo expirado                          | Sistema rejeita e solicita novo codigo                   | ⏭️     |

---

## 11. M08 – Modelos de Visualizacao

### 11.1 Lista (LIST)

| ID     | Tipo | Caso de Teste                                       | Resultado Esperado                                     | Status |
| ------ | ---- | --------------------------------------------------- | ------------------------------------------------------ | ------ |
| TC-196 | FUN  | Visualizar registros em modo Lista                  | Registros exibidos em linhas e colunas                 | ⏭️     |
| TC-197 | FUN  | Mover colunas na visualizacao Lista (drag-drop)     | Colunas reposicionadas conforme drag-and-drop          | ⏭️     |
| TC-198 | FUN  | Redimensionar colunas                               | Largura da coluna ajustada conforme arrasto            | ⏭️     |
| TC-199 | FUN  | Verificar campos configurados na visualizacao Lista | Apenas campos marcados como "exibir na lista" aparecem | ⏭️     |
| TC-200 | FUN  | Navegacao por teclado (setas)                       | Celulas selecionadas via teclado                       | ⏭️     |

### 11.2 Documento (DOCUMENT)

| ID     | Tipo | Caso de Teste                                 | Resultado Esperado                                     | Status |
| ------ | ---- | --------------------------------------------- | ------------------------------------------------------ | ------ |
| TC-201 | FUN  | Visualizar registros em modo Documento        | Cards exibidos com titulo e descricao de cada registro | ⏭️     |
| TC-202 | FUN  | Verificar sidebar hierarquica (TOC)           | Indice exibido com navegacao entre registros           | ⏭️     |
| TC-203 | FUN  | Clicar em card no modo Documento              | Registro completo aberto corretamente                  | ⏭️     |
| TC-204 | FUN  | Exportar documento em PDF                     | PDF gerado com conteudo correto                        | ⏭️     |
| TC-205 | FUN  | Imprimir documento                            | Pagina de impressao renderizada corretamente           | ⏭️     |

### 11.3 Card (CARD)

| ID     | Tipo | Caso de Teste                                          | Resultado Esperado                             | Status |
| ------ | ---- | ------------------------------------------------------ | ---------------------------------------------- | ------ |
| TC-206 | FUN  | Visualizar registros em modo Card                      | Grade de cards exibida corretamente            | ⏭️     |
| TC-207 | FUN  | Verificar titulo do card conforme campo configurado    | Titulo exibido de acordo com a configuracao    | ⏭️     |
| TC-208 | FUN  | Verificar descricao do card conforme campo configurado | Descricao exibida de acordo com a configuracao | ⏭️     |
| TC-209 | FUN  | Verificar imagem de capa no card quando houver         | Imagem exibida corretamente no card            | ⏭️     |
| TC-210 | FUN  | Clicar em card no modo Card                            | Registro completo aberto corretamente          | ⏭️     |

### 11.4 Mosaico (MOSAIC)

| ID     | Tipo | Caso de Teste                                           | Resultado Esperado                       | Status |
| ------ | ---- | ------------------------------------------------------- | ---------------------------------------- | ------ |
| TC-211 | FUN  | Visualizar registros em modo Mosaico                    | Grade exibida sem erros                  | ⏭️     |
| TC-212 | FUN  | Verificar titulo, descricao e imagem de capa no Mosaico | Dados exibidos conforme configuracao    | ⏭️     |
| TC-213 | FUN  | Clicar em item no modo Mosaico                          | Registro completo aberto corretamente    | ⏭️     |
| TC-214 | REG  | Verificar erro conhecido ao abrir registro no Mosaico   | Erro nao deve mais ocorrer apos correcao | ⏭️     |

### 11.5 Galeria (GALLERY)

| ID     | Tipo | Caso de Teste                                         | Resultado Esperado                           | Status |
| ------ | ---- | ----------------------------------------------------- | -------------------------------------------- | ------ |
| TC-215 | FUN  | Visualizar registros em modo Galeria                  | Imagens exibidas em grade sem erros          | ⏭️     |
| TC-216 | FUN  | Verificar carregamento da imagem de capa na Galeria   | Cada card exibe a imagem correta do registro | ⏭️     |
| TC-217 | FUN  | Clicar em item na Galeria                             | Registro completo aberto corretamente        | ⏭️     |
| TC-218 | REG  | Verificar erro conhecido ao abrir registro na Galeria | Erro nao deve mais ocorrer apos correcao     | ⏭️     |

### 11.6 Kanban (KANBAN)

| ID     | Tipo | Caso de Teste                                        | Resultado Esperado                                     | Status |
| ------ | ---- | ---------------------------------------------------- | ------------------------------------------------------ | ------ |
| TC-219 | FUN  | Visualizar registros em modo Kanban                  | Colunas exibidas com cards por registro                | ⏭️     |
| TC-220 | FUN  | Mover card entre colunas (drag-drop)                 | Card movido e valor do campo atualizado                | ⏭️     |
| TC-221 | FUN  | Adicionar nova coluna/lista no Kanban                | Coluna criada e disponivel                             | ⏭️     |
| TC-222 | FUN  | Adicionar card diretamente no Kanban                 | Card criado como novo registro na tabela               | ⏭️     |
| TC-223 | FUN  | Editar card inline no Kanban                         | Dados atualizados sem abrir tela completa              | ⏭️     |
| TC-224 | FUN  | Abrir detalhe do registro a partir do card Kanban    | Registro completo aberto corretamente                  | ⏭️     |
| TC-225 | FUN  | Acoes rapidas no card Kanban                         | Menu de acoes rapidas funciona corretamente            | ⏭️     |

### 11.7 Forum (FORUM)

| ID     | Tipo | Caso de Teste                                        | Resultado Esperado                                     | Status |
| ------ | ---- | ---------------------------------------------------- | ------------------------------------------------------ | ------ |
| TC-226 | FUN  | Visualizar registros em modo Forum                   | Canais e mensagens exibidos corretamente               | ⏭️     |
| TC-227 | FUN  | Criar canal no Forum                                 | Canal criado e disponivel na sidebar                   | ⏭️     |
| TC-228 | FUN  | Editar canal no Forum                                | Nome/descricao do canal atualizado                     | ⏭️     |
| TC-229 | FUN  | Excluir canal no Forum                               | Canal removido da listagem                             | ⏭️     |
| TC-230 | FUN  | Enviar mensagem em canal                             | Mensagem exibida na thread do canal                    | ⏭️     |
| TC-231 | FUN  | Selecionar usuarios participantes de canal           | Apenas usuarios selecionados tem acesso                | ⏭️     |
| TC-232 | FUN  | Visualizacao de documento dentro do forum            | Documento renderizado corretamente                     | ⏭️     |

### 11.8 Calendario (CALENDAR)

| ID     | Tipo | Caso de Teste                                     | Resultado Esperado                                     | Status |
| ------ | ---- | ------------------------------------------------- | ------------------------------------------------------ | ------ |
| TC-233 | FUN  | Visualizar registros em modo Calendario (mes)     | Registros posicionados nos dias corretos               | ⏭️     |
| TC-234 | FUN  | Visualizar registros em modo Calendario (semana)  | Registros posicionados nos dias/horas corretos         | ⏭️     |
| TC-235 | FUN  | Visualizar registros em modo Calendario (agenda)  | Lista de eventos exibida corretamente                  | ⏭️     |
| TC-236 | FUN  | Criar evento (registro) no calendario             | Registro criado com data selecionada                   | ⏭️     |
| TC-237 | FUN  | Excluir evento no calendario                      | Registro removido do calendario                        | ⏭️     |
| TC-238 | FUN  | Navegar entre meses/semanas                       | Calendario atualizado com registros do periodo         | ⏭️     |

### 11.9 Gantt (GANTT)

| ID     | Tipo | Caso de Teste                                     | Resultado Esperado                                     | Status |
| ------ | ---- | ------------------------------------------------- | ------------------------------------------------------ | ------ |
| TC-239 | FUN  | Visualizar registros em modo Gantt                | Timeline exibida com barras por registro               | ⏭️     |
| TC-240 | FUN  | Verificar barras de progresso                     | Barras refletem datas de inicio e fim dos registros    | ⏭️     |
| TC-241 | FUN  | Verificar painel lateral com lista de registros   | Registros listados a esquerda com dados basicos        | ⏭️     |
| TC-242 | FUN  | Navegar na timeline (scroll horizontal)           | Timeline rola suavemente mostrando diferentes periodos | ⏭️     |

---

## 12. M09 – Gestao de Menus

### 12.1 Listagem

| ID     | Tipo | Caso de Teste                              | Resultado Esperado                                                  | Status |
| ------ | ---- | ------------------------------------------ | ------------------------------------------------------------------- | ------ |
| TC-243 | FUN  | Acessar modulo de Menus                    | Menus listados com colunas: nome, slug, tipo, criado por, criado em | ⏭️     |
| TC-244 | FUN  | Verificar paginacao da listagem de menus   | Navegacao entre paginas funciona corretamente                       | ⏭️     |
| TC-245 | FUN  | Verificar exibicao correta do tipo de menu | Tipo exibido conforme cadastrado (TABLE, PAGE, FORM, EXTERNAL, SEPARATOR) | ⏭️     |

### 12.2 Busca

| ID     | Tipo | Caso de Teste                         | Resultado Esperado                               | Status |
| ------ | ---- | ------------------------------------- | ------------------------------------------------ | ------ |
| TC-246 | FUN  | Buscar menu por nome                  | Menu correspondente exibido                      | ⏭️     |
| TC-247 | FUN  | Buscar menu por slug                  | Menu correspondente exibido                      | ⏭️     |
| TC-248 | FUN  | Busca ignorando maiusculas/minusculas | Menu encontrado independentemente da caixa usada | ⏭️     |
| TC-249 | FUN  | Busca parcial de menu                 | Menus com o trecho no nome/slug sao exibidos     | ⏭️     |

### 12.3 Criacao e Edicao

| ID     | Tipo | Caso de Teste                                       | Resultado Esperado                                    | Status |
| ------ | ---- | --------------------------------------------------- | ----------------------------------------------------- | ------ |
| TC-250 | FUN  | Criar menu tipo TABLE vinculado a tabela            | Menu criado e redireciona para tabela                 | ⏭️     |
| TC-251 | FUN  | Criar menu tipo PAGE com conteudo HTML              | Menu criado e exibe pagina HTML                       | ⏭️     |
| TC-252 | FUN  | Criar menu tipo FORM vinculado a tabela             | Menu criado e exibe formulario de criacao             | ⏭️     |
| TC-253 | FUN  | Criar menu tipo EXTERNAL com URL                    | Menu criado e redireciona para URL externa            | ⏭️     |
| TC-254 | FUN  | Criar menu tipo SEPARATOR                           | Separador visual criado na navegacao                  | ⏭️     |
| TC-255 | FUN  | Criar menu hierarquico (com menu pai)               | Menu filho exibido dentro do menu pai                 | ⏭️     |
| TC-256 | NEG  | Criar menu com nome vazio                           | Sistema exibe erro de campo obrigatorio               | ⏭️     |
| TC-257 | NEG  | Criar menu com slug duplicado                       | Sistema rejeita com mensagem de slug ja existente     | ⏭️     |
| TC-258 | VAL  | Criar menu com caracteres especiais                 | Sistema trata corretamente                            | ⏭️     |
| TC-259 | USA  | Verificar se interface de criacao esta em portugues | Todos os textos em PT-BR                              | ⏭️     |
| TC-260 | FUN  | Editar nome de menu existente                       | Nome atualizado na listagem                           | ⏭️     |
| TC-261 | FUN  | Editar slug de menu existente                       | Slug atualizado e navegacao funcionando com novo slug | ⏭️     |
| TC-262 | FUN  | Alterar tipo de menu                                | Tipo atualizado corretamente                          | ⏭️     |
| TC-263 | FUN  | Cancelar edicao de menu                             | Alteracoes descartadas                                | ⏭️     |

### 12.4 Exclusao, Reordenacao e Navegacao

| ID     | Tipo | Caso de Teste                                            | Resultado Esperado                                 | Status |
| ------ | ---- | -------------------------------------------------------- | -------------------------------------------------- | ------ |
| TC-264 | FUN  | Enviar menu para lixeira (soft delete)                   | Menu removido da listagem ativa                    | ⏭️     |
| TC-265 | FUN  | Restaurar menu da lixeira                                | Menu retorna a listagem ativa                      | ⏭️     |
| TC-266 | FUN  | Excluir menu permanentemente (hard delete)               | Menu removido definitivamente                      | ⏭️     |
| TC-267 | FUN  | Reordenar menus via drag-and-drop                        | Ordem atualizada e persistida                      | ⏭️     |
| TC-268 | FUN  | Acessar menu criado                                      | Redirecionamento para a tabela/pagina vinculada    | ⏭️     |
| TC-269 | INT  | Acessar menu com tabela restrita sem login               | Sistema exige autenticacao                         | ⏭️     |
| TC-270 | INT  | Acessar menu com tabela restrita com login sem permissao | Acesso negado com mensagem adequada                | ⏭️     |

---

## 13. M10 – Clonagem de Tabelas

| ID     | Tipo | Caso de Teste                                              | Resultado Esperado                                | Status |
| ------ | ---- | ---------------------------------------------------------- | ------------------------------------------------- | ------ |
| TC-271 | FUN  | Abrir dropdown de modelos para clonagem                    | Lista de modelos (de MODEL_CLONE_TABLES) exibida  | ⏭️     |
| TC-272 | FUN  | Selecionar modelo e informar nome para clonar              | Tabela clonada com estrutura completa             | ⏭️     |
| TC-273 | FUN  | Verificar campos clonados na nova tabela                   | Todos os campos (com tipos) copiados corretamente | ⏭️     |
| TC-274 | FUN  | Verificar grupos de campos na tabela clonada               | Grupos de campos copiados com seus campos         | ⏭️     |
| TC-275 | FUN  | Verificar relacionamentos na tabela clonada                | Relacionamentos preservados e funcionais          | ⏭️     |
| TC-276 | FUN  | Confirmar que registros NAO foram clonados                 | Nova tabela criada vazia (sem registros)          | ⏭️     |
| TC-277 | NEG  | Clonar sem selecionar modelo base                          | Sistema exibe erro de validacao                   | ⏭️     |
| TC-278 | NEG  | Clonar sem informar nome da nova tabela                    | Sistema exibe erro de campo obrigatorio           | ⏭️     |
| TC-279 | NEG  | Clonar com nome duplicado                                  | Sistema rejeita com mensagem de nome existente    | ⏭️     |
| TC-280 | VAL  | Clonar com caracteres especiais no nome                    | Tabela criada corretamente                        | ⏭️     |
| TC-281 | REG  | Verificar se campos da lixeira foram excluidos da clonagem | Campos deletados nao aparecem na tabela clonada   | ⏭️     |
| TC-282 | FUN  | Criar registros na tabela clonada                          | Registros criados normalmente                     | ⏭️     |
| TC-283 | FUN  | Aplicar filtros na tabela clonada                          | Filtros funcionam corretamente                    | ⏭️     |

---

## 14. M11 – Configuracoes do Sistema

| ID     | Tipo | Caso de Teste                                              | Resultado Esperado                           | Status |
| ------ | ---- | ---------------------------------------------------------- | -------------------------------------------- | ------ |
| TC-284 | FUN  | Alterar nome do sistema (SYSTEM_NAME)                      | Novo nome exibido na interface imediatamente | ⏭️     |
| TC-285 | FUN  | Alterar logotipo do sistema (pequeno e grande)             | Novos logos exibidos na interface             | ⏭️     |
| TC-286 | FUN  | Alterar locale (pt-br/en-us)                               | Interface atualizada para o idioma           | ⏭️     |
| TC-287 | FUN  | Configurar limite de upload (tamanho maximo)               | Uploads acima do limite sao rejeitados       | ⏭️     |
| TC-288 | FUN  | Configurar tipos de arquivo aceitos                        | Apenas tipos permitidos sao aceitos          | ⏭️     |
| TC-289 | FUN  | Configurar max arquivos por upload                         | Limite respeitado no upload                  | ⏭️     |
| TC-290 | FUN  | Configurar paginacao padrao                                | Listagens usam novo valor                    | ⏭️     |
| TC-291 | FUN  | Configurar driver de storage (local/S3)                    | Uploads direcionados ao driver correto       | ⏭️     |
| TC-292 | FUN  | Configurar provedor de email (SMTP)                        | Emails enviados pelo novo provedor           | ⏭️     |
| TC-293 | FUN  | Selecionar tabelas modelo para clonagem                    | Tabelas disponveis no dropdown de clonagem   | ⏭️     |
| TC-294 | FUN  | Verificar persistencia das configuracoes apos logout/login | Configuracoes mantidas apos nova sessao      | ⏭️     |
| TC-295 | FUN  | Verificar persistencia apos reload da pagina               | Configuracoes mantidas sem novo salvamento   | ⏭️     |

---

## 15. M12 – Performance

### 15.1 Volume de dados

| ID     | Tipo | Caso de Teste                                    | Resultado Esperado                          | Status |
| ------ | ---- | ------------------------------------------------ | ------------------------------------------- | ------ |
| TC-296 | PER  | Listar tabela com 100.000 registros              | Carregamento em tempo aceitavel (< 3s)      | ⏭️     |
| TC-297 | PER  | Listar tabela com 1.000.000 registros            | Paginacao funcional; sem timeout            | ⏭️     |
| TC-298 | PER  | Listar tabela com 10.000.000 registros           | Sistema responsivo com paginacao; sem crash | ⏭️     |
| TC-299 | PER  | Busca com 100.000 registros                      | Resultado retornado em tempo aceitavel      | ⏭️     |
| TC-300 | PER  | Filtro com 1.000.000 de registros                | Resultado retornado sem timeout             | ⏭️     |
| TC-301 | PER  | Insercao em massa em tabela com 10M de registros | Insercao concluida sem degradacao critica   | ⏭️     |

### 15.2 Carga de usuarios simultaneos

| ID     | Tipo | Caso de Teste                                    | Resultado Esperado                                        | Status |
| ------ | ---- | ------------------------------------------------ | --------------------------------------------------------- | ------ |
| TC-302 | PER  | 10 usuarios simultaneos realizando buscas        | Sistema responde corretamente a todos                     | ⏭️     |
| TC-303 | PER  | 100 usuarios simultaneos realizando buscas       | Sem erros ou timeout significativos                       | ⏭️     |
| TC-304 | PER  | 1.000 usuarios simultaneos realizando buscas     | Sistema se mantem estavel                                 | ⏭️     |
| TC-305 | PER  | 100 usuarios inserindo registros simultaneamente | Todos os registros inseridos corretamente; sem duplicacao | ⏭️     |
| TC-306 | PER  | 1.000 usuarios aplicando filtros simultaneamente | Sistema responde sem erros criticos                       | ⏭️     |

---

## 16. M13 – Seguranca

| ID     | Tipo | Caso de Teste                                                  | Resultado Esperado                                             | Status |
| ------ | ---- | -------------------------------------------------------------- | -------------------------------------------------------------- | ------ |
| TC-307 | SEG  | Acessar rota protegida sem token                               | Sistema retorna 401 e redireciona ao login                     | ⏭️     |
| TC-308 | SEG  | Enviar token invalido na API                                   | Sistema rejeita com 401 ou 403                                 | ⏭️     |
| TC-309 | SEG  | Enviar token expirado                                          | Sistema rejeita e solicita novo login                          | ⏭️     |
| TC-310 | SEG  | Enviar refresh token em rota de access token                   | Sistema rejeita (valida type === ACCESS)                       | ⏭️     |
| TC-311 | SEG  | Requisicao de origem nao permitida (CORS)                      | Sistema bloqueia com erro de CORS                              | ⏭️     |
| TC-312 | SEG  | Acessar endpoint de outro usuario com token valido de terceiro | Sistema nega acesso com 403                                    | ⏭️     |
| TC-313 | SEG  | Verificar que senha nao trafega em texto plano                 | Valor do campo senha nao aparece em plain text nas requisicoes | ⏭️     |
| TC-314 | SEG  | Tentar acessar painel de admin com usuario comum               | Acesso negado; sem exposicao de dados sensiveis                | ⏭️     |
| TC-315 | SEG  | Verificar cookies httpOnly e secure                            | Cookies nao acessiveis via JavaScript                          | ⏭️     |
| TC-316 | SEG  | Verificar sandbox — script tenta acessar require/fs            | Script bloqueado e erro retornado                              | ⏭️     |
| TC-317 | SEG  | Verificar sandbox — script com loop infinito                   | Timeout de 5s acionado e execucao interrompida                 | ⏭️     |

---

## 17. M14 – Dashboard

| ID     | Tipo | Caso de Teste                                       | Resultado Esperado                              | Status |
| ------ | ---- | --------------------------------------------------- | ----------------------------------------------- | ------ |
| TC-318 | FUN  | Acessar dashboard como MASTER                       | Dashboard carregado com graficos e estatisticas | ⏭️     |
| TC-319 | FUN  | Verificar grafico de tabelas                        | Grafico exibido com dados corretos              | ⏭️     |
| TC-320 | FUN  | Verificar grafico de usuarios                       | Grafico exibido com dados corretos              | ⏭️     |
| TC-321 | FUN  | Verificar atividade recente                         | Ultimas acoes exibidas cronologicamente         | ⏭️     |
| TC-322 | FUN  | Verificar cards de estatisticas                     | Numeros refletem dados reais do sistema         | ⏭️     |
| TC-323 | SEG  | Acessar dashboard como ADMINISTRATOR                | Acesso negado (somente MASTER)                  | ⏭️     |
| TC-324 | SEG  | Acessar dashboard como MANAGER                      | Acesso negado                                   | ⏭️     |
| TC-325 | SEG  | Acessar dashboard como REGISTERED                   | Acesso negado                                   | ⏭️     |

---

## 18. M15 – Chat IA

| ID     | Tipo | Caso de Teste                                    | Resultado Esperado                                     | Status |
| ------ | ---- | ------------------------------------------------ | ------------------------------------------------------ | ------ |
| TC-326 | FUN  | Abrir painel de chat                             | Painel renderizado com area de mensagens               | ⏭️     |
| TC-327 | FUN  | Enviar mensagem de texto                         | Mensagem enviada e resposta da IA recebida             | ⏭️     |
| TC-328 | FUN  | Verificar indicador de "pensando"                | Indicador exibido enquanto IA processa                 | ⏭️     |
| TC-329 | FUN  | Enviar imagem no chat                            | Imagem convertida para base64 e processada pela IA     | ⏭️     |
| TC-330 | FUN  | Enviar PDF no chat                               | PDF parseado e texto extraido para processamento       | ⏭️     |
| TC-331 | FUN  | Verificar tool calls (MCP)                       | Ferramentas descobertas e executadas dinamicamente      | ⏭️     |
| TC-332 | SEG  | Tentar usar chat sem autenticacao                | Conexao Socket.IO rejeitada                            | ⏭️     |
| TC-333 | FUN  | Verificar eventos em tempo real                  | Eventos status/ready/thinking/message emitidos          | ⏭️     |

---

## 19. M16 – Forum

| ID     | Tipo | Caso de Teste                                   | Resultado Esperado                               | Status |
| ------ | ---- | ----------------------------------------------- | ------------------------------------------------ | ------ |
| TC-334 | FUN  | Criar canal de forum                            | Canal criado e exibido na sidebar                | ⏭️     |
| TC-335 | FUN  | Editar canal de forum                           | Nome/descricao atualizados                       | ⏭️     |
| TC-336 | FUN  | Excluir canal de forum                          | Canal removido da listagem                       | ⏭️     |
| TC-337 | FUN  | Enviar mensagem em canal                        | Mensagem exibida na thread                       | ⏭️     |
| TC-338 | FUN  | Selecionar usuarios participantes               | Somente participantes selecionados tem acesso    | ⏭️     |
| TC-339 | FUN  | Adicionar mensagem de forum a registro (API)    | Mensagem vinculada ao registro via endpoint      | ⏭️     |

---

## 20. M17 – Paginas Customizadas

| ID     | Tipo | Caso de Teste                                   | Resultado Esperado                               | Status |
| ------ | ---- | ----------------------------------------------- | ------------------------------------------------ | ------ |
| TC-340 | FUN  | Acessar pagina customizada por slug             | Conteudo HTML renderizado corretamente           | ⏭️     |
| TC-341 | FUN  | Verificar que pagina usa HTML do menu PAGE      | Conteudo corresponde ao campo html do menu       | ⏭️     |
| TC-342 | SEG  | Acessar pagina sem permissao do menu associado  | Acesso negado                                    | ⏭️     |

---

## 21. M18 – Import/Export

| ID     | Tipo | Caso de Teste                                   | Resultado Esperado                               | Status |
| ------ | ---- | ----------------------------------------------- | ------------------------------------------------ | ------ |
| TC-343 | FUN  | Exportar tabela com estrutura e dados           | Arquivo gerado com dados corretos                | ⏭️     |
| TC-344 | FUN  | Importar tabela a partir de arquivo exportado   | Tabela criada com estrutura e dados completos    | ⏭️     |
| TC-345 | NEG  | Importar arquivo com formato invalido           | Sistema exibe erro de validacao                  | ⏭️     |
| TC-346 | FUN  | Exportar tabela sem registros                   | Arquivo gerado apenas com estrutura              | ⏭️     |

---

## 22. M19 – Perfil

| ID     | Tipo | Caso de Teste                                   | Resultado Esperado                               | Status |
| ------ | ---- | ----------------------------------------------- | ------------------------------------------------ | ------ |
| TC-347 | FUN  | Visualizar dados do perfil                      | Nome, email e role exibidos corretamente         | ⏭️     |
| TC-348 | FUN  | Editar nome no perfil                           | Nome atualizado e refletido na interface         | ⏭️     |
| TC-349 | FUN  | Editar email no perfil                          | Email atualizado corretamente                    | ⏭️     |
| TC-350 | FUN  | Alterar senha propria no perfil                 | Senha alterada com sucesso                       | ⏭️     |

---

## 23. M20 – Scripts/Sandbox

| ID     | Tipo | Caso de Teste                                          | Resultado Esperado                                     | Status |
| ------ | ---- | ------------------------------------------------------ | ------------------------------------------------------ | ------ |
| TC-351 | FUN  | Configurar script onLoad em tabela                     | Script executado ao carregar formulario                | ⏭️     |
| TC-352 | FUN  | Configurar script beforeSave em tabela                 | Script executado antes de salvar registro              | ⏭️     |
| TC-353 | FUN  | Configurar script afterSave em tabela                  | Script executado apos salvar registro                  | ⏭️     |
| TC-354 | FUN  | Usar API field.get/set no script                       | Valores de campos lidos e escritos corretamente        | ⏭️     |
| TC-355 | FUN  | Usar API context no script                             | Dados de contexto (action, userId, isNew) acessiveis   | ⏭️     |
| TC-356 | FUN  | Usar API email.send no script                          | Email enviado com sucesso                              | ⏭️     |
| TC-357 | FUN  | Usar API utils no script                               | today, now, formatDate, sha256, uuid funcionam         | ⏭️     |
| TC-358 | FUN  | Verificar logs capturados (console.log)                | Logs retornados no resultado da execucao               | ⏭️     |
| TC-359 | FUN  | Editar scripts no editor Monaco                        | Editor renderizado com syntax highlighting             | ⏭️     |
| TC-360 | SEG  | Script tenta acessar require()                         | Acesso bloqueado e erro retornado                      | ⏭️     |
| TC-361 | SEG  | Script tenta acessar filesystem (fs)                   | Acesso bloqueado e erro retornado                      | ⏭️     |
| TC-362 | SEG  | Script tenta acessar network                           | Acesso bloqueado e erro retornado                      | ⏭️     |
| TC-363 | SEG  | Script com loop infinito (timeout 5s)                  | Execucao interrompida com erro de timeout              | ⏭️     |
| TC-364 | NEG  | Script com erro de sintaxe                             | Erro de sintaxe detectado antes da execucao            | ⏭️     |

---

## 24. M21 – Storage

| ID     | Tipo | Caso de Teste                                   | Resultado Esperado                               | Status |
| ------ | ---- | ----------------------------------------------- | ------------------------------------------------ | ------ |
| TC-365 | FUN  | Upload de arquivo via endpoint /storage         | Arquivo salvo e URL gerada                       | ⏭️     |
| TC-366 | FUN  | Upload de multiplos arquivos                    | Todos os arquivos salvos com URLs individuais    | ⏭️     |
| TC-367 | FUN  | Excluir arquivo via endpoint /storage/:_id      | Arquivo removido do storage                      | ⏭️     |
| TC-368 | FUN  | Verificar storage local (driver local)          | Arquivos salvos em _storage/ com URL via servidor | ⏭️     |
| TC-369 | FUN  | Verificar storage S3 (driver s3)                | Arquivos salvos no bucket S3                     | ⏭️     |
| TC-370 | NEG  | Upload de arquivo acima do limite de tamanho    | Requisicao rejeitada com mensagem de erro        | ⏭️     |
| TC-371 | NEG  | Upload de tipo MIME nao aceito                  | Requisicao rejeitada com mensagem de erro        | ⏭️     |

---

## 25. Testes de Regressao

> Executar apos cada correcao de bug registrado nas pendencias.

| ID     | Bug Ref. | Caso de Teste                                                          | Resultado Esperado                                | Status |
| ------ | -------- | ---------------------------------------------------------------------- | ------------------------------------------------- | ------ |
| TC-372 | P01      | Editar registro com campo Password — verificar se senha foi preservada | Valor da senha mantido apos edicao                | ⏭️     |
| TC-373 | P02      | Verificar truncamento de URL longa em campo URL                        | URL exibida com "..." na listagem                 | ⏭️     |
| TC-374 | P03      | Abrir registro nos modelos Mosaico e Galeria                           | Registro abre sem erro                            | ⏭️     |
| TC-375 | P04      | Editar nome de grupo de campos e verificar na interface                | Novo nome exibido corretamente na tela            | ⏭️     |
| TC-376 | P05      | Clonar tabela e verificar ausencia de campos da lixeira                | Campos deletados nao aparecem na clonagem         | ✅     |
| TC-377 | P06      | Filtrar registros por periodo em campo Data                            | Filtro por periodo funciona corretamente          | ⏭️     |
| TC-378 | P07      | Verificar exibicao visual da opcao "Exibir na lista"                   | Sem bugs de layout na configuracao de campos      | ⏭️     |
| TC-379 | P08      | Excluir grupo de permissao                                             | Opcao disponivel e funcionando                    | ⏭️     |
| TC-380 | P10      | Consultar registros por relacionamento                                 | Opcao disponivel e filtrando corretamente         | ⏭️     |
| TC-381 | P11      | Compartilhar link de tabela pela listagem                              | Opcao disponivel e link copiado corretamente      | ✅     |
| TC-382 | P12      | Alterar senha — verificar invalidacao de sessao ativa                  | Usuario perde o acesso imediatamente              | ⏭️     |
| TC-383 | P13      | Verificar ortografia "Acoes" no menu de acoes                          | Escrito com acento correto                        | ⏭️     |
| TC-384 | P14      | Busca global de listas sem paginacao manual                            | Busca encontra lista em qualquer pagina           | ⏭️     |
| TC-385 | P15      | Verificar textos da interface — todos em portugues                     | Nenhum texto em ingles na interface               | ⏭️     |
| TC-386 | P16      | Enviar campo obrigatorio para lixeira e verificar obrigatoriedade      | Campo passa a ser nao obrigatorio automaticamente | ✅     |
| TC-387 | P17      | Restaurar grupo de campos da lixeira                                   | Fluxo de restauracao disponivel e funcional       | ⏭️     |
| TC-397 | P18      | Verificar que campo Password nao retorna hash na resposta da API                   | Hash de senha nao presente nas respostas          | ⏭️     |
| TC-398 | P19      | Verificar que dashboard exibe dados reais (nao mock)                                | Graficos e cards refletem dados do banco           | ⏭️     |
| TC-399 | P28      | Verificar campo Criador no Grupo de Campos                                          | Campo Criador exibido corretamente                 | ⏭️     |
| TC-400 | P29      | Verificar largura de campo no grupo de campos refletida na listagem                 | Largura aplicada conforme configurado              | ⏭️     |
| TC-401 | P33      | Excluir tabela permanentemente e recriar com mesmo nome — sem dados antigos          | Nova tabela criada vazia                           | ⏭️     |
| TC-402 | P34      | Botao voltar na edicao de tabela deve retornar a propria tabela                      | Redirecionamento para a tabela editada             | ⏭️     |
| TC-403 | P35      | Editar descricao e verificar retorno a tabela                                        | Retorno para pagina da tabela apos salvar          | ⏭️     |
| TC-404 | P36      | Verificar console sem erro React minified ao abrir aplicacao                         | Sem erros de React no console                      | ⏭️     |

---

## 26. Testes de Interface e Compatibilidade

| ID     | Tipo | Caso de Teste                                         | Resultado Esperado                              | Status |
| ------ | ---- | ----------------------------------------------------- | ----------------------------------------------- | ------ |
| TC-388 | USA  | Verificar exibicao em Google Chrome (ultima versao)   | Interface sem distorcoes ou erros visuais       | ⏭️     |
| TC-389 | USA  | Verificar exibicao em Mozilla Firefox (ultima versao) | Interface sem distorcoes ou erros visuais       | ⏭️     |
| TC-390 | USA  | Verificar exibicao em Microsoft Edge (ultima versao)  | Interface sem distorcoes ou erros visuais       | ⏭️     |
| TC-391 | USA  | Verificar exibicao em Safari (ultima versao)          | Interface sem distorcoes ou erros visuais       | ⏭️     |
| TC-392 | USA  | Verificar exibicao de IDs de campos na interface      | IDs exibidos corretamente onde aplicavel        | ⏭️     |
| TC-393 | USA  | Verificar campos nativos do sistema                   | Campos padrao do sistema funcionam corretamente | ⏭️     |
| TC-394 | FUN  | Verificar redirecionamento para rota padrao ao logar  | Usuario vai para rota padrao do seu role        | ⏭️     |
| TC-395 | FUN  | Verificar lazy loading de componentes pesados          | Monaco e Tiptap carregados sob demanda          | ⏭️     |
| TC-396 | FUN  | Verificar SEO — robots.txt e sitemap.xml              | Arquivos gerados e acessiveis                   | ⏭️     |

---

## 27. Resumo de Pendencias Conhecidas

| ID  | Tipo        | Descricao                                                    | Status     |
| --- | ----------- | ------------------------------------------------------------ | ---------- |
| P01 | ❌ Bug      | Campo Password perde o valor apos edicao de registro         | Aberto     |
| P02 | ❌ Bug      | Campo URL nao trunca texto longo na listagem                 | Aberto     |
| P03 | ❌ Bug      | Modelos Mosaico e Galeria apresentam erro ao abrir registros | Aberto     |
| P04 | ❌ Bug      | Edicao do nome de Grupo de Campos nao reflete na interface   | Aberto     |
| P05 | ✅ Resolvido | ~~Clonagem de tabela inclui campos da lixeira~~ — Codigo filtra campos com !f.trashed | Resolvido |
| P06 | ❌ Bug      | Campo Data nao possui filtro por periodo implementado        | Aberto     |
| P07 | ❌ Bug      | Opcao "Exibir na lista" apresenta bug visual                 | Aberto     |
| P08 | ❌ Ausente  | Sem opcao de excluir grupo de permissao                      | Aberto     |
| P09 | ✅ Resolvido | ~~Sem opcao de excluir menu~~ — Backend ja tem trash/restore/hard-delete | Implementado |
| P10 | ❌ Ausente  | Consulta por relacionamento nao funciona                     | Aberto     |
| P11 | ✅ Resolvido | ~~Sem botao compartilhar link~~ — Acao "Compartilhar" copia link para clipboard | Implementado |
| P12 | ⚠️ Ajuste   | Troca de senha nao invalida sessao ativa                     | Aberto     |
| P13 | ⚠️ Ajuste   | Ortografia "Acoes" incorreta                                 | Aberto     |
| P14 | 🔁 Reteste  | Busca de listas restrita a pagina atual — backend ja suporta busca global | Reteste    |
| P15 | ⚠️ Ajuste   | Textos em ingles na interface                                | Aberto     |
| P16 | ✅ Resolvido | ~~Campo enviado a lixeira deve se tornar nao obrigatorio~~ — send-to-trash define required: false | Implementado |
| P17 | 🔁 Reteste | ~~Restauracao de grupos de campos da lixeira~~ — Backend tem endpoint restore implementado | Reteste |
| P18 | ❌ Bug      | Funcao maskPasswordFields() no backend existe mas nao e chamada — hash de senha exposto na API | Aberto     |
| P19 | ❌ Ausente  | Dashboard utiliza dados mock em vez de dados reais da API                                       | Aberto     |
| P20 | 🆕 Melhoria | Campo arquivo: salvar URL relativa no banco (base + relativo para facilitar migracao)           | Aberto     |
| P21 | 🆕 Melhoria | Grupo de campos: replicar interface de tabelas na pagina de detalhes                            | Aberto     |
| P22 | 🆕 Melhoria | Grupo de campos: visibilidade configuravel na tela de edicao do campo                           | Aberto     |
| P23 | ⚠️ Ajuste   | Menu: ordenacao dentro do mesmo nivel hierarquico via dropdown "Exibir depois de"               | Aberto     |
| P24 | 🆕 Melhoria | Menu: definir opcao como home do sistema                                                        | Aberto     |
| P25 | 🆕 Melhoria | Configuracao para ativar/desativar assistente de IA                                             | Aberto     |
| P26 | 🆕 Melhoria | Migrations automaticas a cada nova instalacao                                                   | Aberto     |
| P27 | 🆕 Melhoria | Migrar storage para MinIO                                                                       | Aberto     |
| P28 | ❌ Bug      | Campo Criador nao aparece no Grupo de Campos                                                    | Aguardando |
| P29 | ❌ Bug      | Largura de campo no grupo de campos nao reflete na listagem                                     | Aberto     |
| P30 | ❌ Bug      | Texto rico com cor branca mostra codigo HTML ao visualizar                                      | Aberto     |
| P31 | ❌ Bug      | Tag nao permite alterar a cor                                                                   | Aberto     |
| P32 | ❌ Bug      | Ordenacao de campos nativos nao reflete na visualizacao de detalhes                             | Aberto     |
| P33 | ❌ Bug      | Dados persistidos apos exclusao permanente — registros antigos voltam ao recriar com mesmo nome | Aberto     |
| P34 | ❌ Bug      | Botao voltar na edicao de tabela redireciona para listagem geral                                | Aberto     |
| P35 | 🔁 Reteste | Editar descricao redireciona para menu geral — report 22/03 indica correcao de redirecionamento | Reteste   |
| P36 | ❌ Bug      | Erro React minified ao abrir aplicacao — atrapalha testes automatizados Cypress                 | Aberto     |
| P37 | ⚠️ Ajuste   | Visibilidade "Publica" e "Formulario" sem acentuacao na interface                               | Aberto     |
| P38 | 🆕 Melhoria | Permitir alterar slug da tabela (minusculo, normalizado, unico)                                 | Aberto     |
| P39 | 🆕 Melhoria | Opcao dropdown editavel (duplo clique, propagar para registros existentes)                       | Aberto     |
| P40 | 🆕 Melhoria | Esvaziar lixeira para todas as tabelas inclusive a Tabela das Tabelas                           | Aberto     |
| P41 | 🆕 Melhoria | IDs para todos os campos dos formularios (formato: slug-tabela-slug-campo)                      | Aberto     |
| P42 | 🆕 Melhoria | Markdown para texto longo e pagina com toggle codigo/formatado                                  | Aberto     |
| P43 | 🔁 Reteste | Configuracao campos default para layouts — report 22/03 indica mapeamento em andamento          | Reteste    |
| P44 | 🆕 Melhoria | Valor default para campos (dropdown e demais)                                                   | Aberto     |
| P45 | 🆕 Melhoria | Campo relacionamento: adicionar novo registro inline via modal                                  | Aberto     |
| P46 | 🆕 Melhoria | Campo dropdown: permitir usuario inserir novas tags                                             | Aberto     |
| P47 | 🆕 Melhoria | Import/Export via CSV                                                                           | Aberto     |
| P48 | 🆕 Melhoria | Notificacoes e Websocket (tempo real)                                                           | Aberto     |
| P49 | 🆕 Melhoria | Formularios de gestao: 2 campos por linha                                                       | Aberto     |
| P50 | 🆕 Melhoria | Ao criar campo, exibir no final da lista                                                        | Aberto     |
| P51 | ⚠️ Ajuste   | Mensagem de campo duplicado nao exibida                                                         | Aberto     |
| P52 | 🆕 Melhoria | Link "Esqueceu a senha" na tela de login                                                        | Aberto     |
| P53 | 🆕 Melhoria | Filtros em barra lateral estilo e-commerce                                                      | Aberto     |
| P54 | 🆕 Melhoria | 2 conexoes MongoDB (colecoes nativas vs dados do usuario)                                       | Aberto     |
| P55 | 🆕 Melhoria | Tabelas/campos via arquivo de migrations                                                        | Aberto     |
| P56 | 🆕 Melhoria | Agendamentos CRON/Jobs                                                                          | Aberto     |
| P57 | 🆕 Melhoria | User Metadata — tabela estender metadados do usuario via grupo de campos                        | Aberto     |
| P58 | 🆕 Melhoria | Dicas do campo (tooltip no formulario de adicionar/editar)                                      | Aberto     |
| P59 | 🆕 Melhoria | Log de acoes dos usuarios                                                                       | Aberto     |
| P60 | 🆕 Melhoria | Tabela e campos multilinguais (string nome com suporte a varios idiomas)                        | Aberto     |
| P61 | 🆕 Melhoria | Campos nativos para grupo de campos (ID, Created-by, Created-date)                              | Aberto     |
| P62 | 🆕 Melhoria | Detalhes: definicao de tamanho de largura                                                       | Aberto     |
| P63 | 🆕 Melhoria | Referencia a IA e MCP no site                                                                   | Aberto     |
| P64 | 🆕 Melhoria | Referencia ao Headless CMS no site                                                              | Aberto     |
| P65 | 🆕 Melhoria | Configurar Docker nos ambientes Coolify                                                         | Aberto     |
| P66 | 🆕 Melhoria | Configurar Redis                                                                                | Aberto     |
| P67 | 🆕 Melhoria | Configurar Websocket                                                                            | Aberto     |

---

## 28. Backlog de Bugs e Ajustes

### Bugs Confirmados

| ID  | Descricao | Reportado por | Status |
| --- | --------- | ------------- | ------ |
| P18 | Funcao `maskPasswordFields()` no backend nao e chamada — hash de senha exposto na API | Analise de codigo | Aberto |
| P19 | Dashboard utiliza dados mock em vez de dados reais da API | Analise de codigo | Aberto |
| P28 | Campo Criador nao aparece no Grupo de Campos | Lauriana | Aguardando |
| P29 | Largura de campo no grupo de campos nao reflete na listagem | Lauriana | Aberto |
| P30 | Texto rico com cor branca mostra codigo HTML ao visualizar | Lauriana | Aberto |
| P31 | Tag nao permite alterar a cor | Lauriana | Aberto |
| P32 | Ordenacao de campos nativos nao reflete na visualizacao de detalhes | Lauriana | Aberto |
| P33 | Dados persistidos apos exclusao permanente de tabela — registros antigos voltam ao recriar com mesmo nome | Lauriana/Marcel | Aberto |
| P34 | Botao voltar na edicao de tabela redireciona para listagem geral | Lauriana | Aberto |
| P35 | Editar descricao da tabela redireciona para menu geral | Lauriana | Aberto |
| P36 | Erro React minified ao abrir aplicacao (atrapalha Cypress) | Lauriana | Aberto |

### Ajustes Pendentes

| ID  | Descricao | Reportado por | Status |
| --- | --------- | ------------- | ------ |
| P23 | Menu: ordenacao dentro do mesmo nivel hierarquico via dropdown "Exibir depois de" | Equipe | Aberto |
| P37 | Visibilidade "Publica" e "Formulario" sem acentuacao | Lauriana | Aberto |
| P51 | Mensagem de campo duplicado nao exibida | Lauriana | Aberto |

---

## 29. Backlog de Melhorias

### Infraestrutura

| ID  | Descricao | Prioridade |
| --- | --------- | ---------- |
| P26 | Migrations automaticas a cada nova instalacao | Alta |
| P27 | Migrar storage para MinIO | Alta |
| P54 | 2 conexoes MongoDB (nativas vs dados do usuario) | Media |
| P55 | Tabelas/campos via arquivo de migrations | Media |
| P56 | Agendamentos CRON/Jobs | Media |
| P65 | Configurar Docker Coolify | Alta |
| P66 | Configurar Redis | Alta |
| P67 | Configurar Websocket | Alta |

### Campos e Formularios

| ID  | Descricao | Prioridade |
| --- | --------- | ---------- |
| P20 | Campo arquivo: salvar URL relativa no banco (base + relativo para migracao) | Alta |
| P38 | Permitir alterar slug da tabela | Media |
| P39 | Opcao dropdown editavel (duplo clique, propagar para registros existentes) | Media |
| P44 | Valor default para campos (dropdown e demais) | Media |
| P45 | Campo relacionamento: adicionar novo registro inline via modal | Media |
| P46 | Campo dropdown: permitir usuario inserir novas tags | Media |
| P50 | Ao criar campo, exibir no final da lista | Baixa |
| P58 | Dicas do campo (tooltip no formulario) | Baixa |
| P61 | Campos nativos para grupo de campos (ID, Created-by, Created-date) | Media |
| P62 | Detalhes: definicao de tamanho de largura | Media |

### Interface e Usabilidade

| ID  | Descricao | Prioridade |
| --- | --------- | ---------- |
| P41 | IDs para todos os campos dos formularios (formato: slug-tabela-slug-campo) | Media |
| P42 | Markdown para texto longo e pagina (editor simples vs rich text com toggle codigo) | Media |
| P43 | Configuracao de campos default para layouts (titulo, descricao, cover por tipo) | Media |
| P47 | Import/Export via CSV | Media |
| P49 | Formularios de gestao: 2 campos por linha | Baixa |
| P52 | Link "Esqueceu a senha" na tela de login | Media |
| P53 | Filtros em barra lateral (estilo e-commerce) | Baixa |

### Menus

| ID  | Descricao | Prioridade |
| --- | --------- | ---------- |
| P23 | Ordenacao dentro do mesmo nivel hierarquico via dropdown "Exibir depois de" | Media |
| P24 | Definir opcao do menu como home do sistema | Media |

### Grupo de Campos

| ID  | Descricao | Prioridade |
| --- | --------- | ---------- |
| P21 | Replicar interface de tabelas na pagina de detalhes do grupo | Alta |
| P22 | Visibilidade configuravel na tela de edicao do campo | Media |

### Funcionalidades Novas

| ID  | Descricao | Prioridade |
| --- | --------- | ---------- |
| P25 | Configuracao para ativar/desativar assistente de IA | Media |
| P40 | Esvaziar lixeira para todas as tabelas (inclusive Tabela das Tabelas) | Media |
| P48 | Notificacoes e Websocket (tempo real) | Alta |
| P57 | User Metadata — tabela estender metadados do usuario via grupo de campos | Baixa |
| P59 | Log de acoes dos usuarios | Media |
| P60 | Tabela e campos multilinguais | Baixa |

### Site

| ID  | Descricao | Prioridade |
| --- | --------- | ---------- |
| P63 | Referencia a IA e MCP no site | Media |
| P64 | Referencia ao Headless CMS no site | Media |

---

## 30. Itens Resolvidos

| Descricao | Resolvido por | Data | Evidencia |
| --------- | ------------- | ---- | --------- |
| Cross-browser CORS | Jhollyfer | 24/02/2026 | Variaveis de ambiente com origens permitidas |
| Bloqueio de duplicidade de arquivos no upload | Jhollyfer | 19/02/2026 | Validacao de duplicidade no mesmo registro |
| Coluna "Criado por" na listagem de tabelas | Jhollyfer | 19/02/2026 | Coluna adicionada na listagem geral |
| Cache cookies Chrome impedindo autenticacao | Jhollyfer | 12/02/2026 | Camada de verificacao extra no backend |
| Campos nativos ocultos no gerenciar campos | Jhollyfer | 12/02/2026 | Campos nativos removidos da visualizacao |
| Valor default tamanho campo (10% lista, 50% form) | Jhollyfer | 12/02/2026 | Valores padrao definidos |
| Dropdown de largura substituido por input 0-100 | Jhollyfer | 12/02/2026 | Campo numerico de 0 a 100 |
| Perfil usuario logado na listagem de usuarios | Jhollyfer | 18/02/2026 | Usuario logado adicionado a lista |
| Botoes excluir definitivamente tabelas | Jhollyfer | 12/02/2026 | Trash/restore/hard-delete implementados |
| Dropdown sem opcoes (campos nativos) | Jhollyfer | 18/02/2026 | Corrigido apos refinamento campos nativos |
| Galeria com imagem destaque e 2 colunas | Jhollyfer | 13/02/2026 | Layout com imagem acima e campos abaixo |
| Ordenacao padrao lista (ASC/DESC) | Jhollyfer | 23/02/2026 | Movido para edicao da tabela |
| Salvar automaticamente ao mudar de aba (ordenacao) | Jhollyfer | 29/03/2026 | Commit d463c50 |
| Site correcoes (acentuacao, portugues, layout) | Jhollyfer | 10/03/2026 | Site atualizado |
| Clone de tabela nao inclui campos da lixeira (P05) | Jhollyfer | — | Filtro `!f.trashed` no use-case |
| Botao compartilhar link de tabela (P11) | Jhollyfer | — | Acao "Compartilhar" no frontend |
| Campo enviado a lixeira fica nao obrigatorio (P16) | Jhollyfer | — | `required: false` no send-to-trash |
| Menu com trash/restore/hard-delete (P09) | Jhollyfer | — | Endpoints implementados |
| Grupo de campos migrado para nova abordagem | Jhollyfer | 29/03/2026 | Gerenciamento na tela de detalhes do registro |
| Redirecionamento apos editar descricao da tabela (P35) | Jhollyfer | 22/03/2026 | Redirecionamento para pagina da tabela |
| Mapeamento campos para tipos de layout (P43) | Jhollyfer | 22/03/2026 | Campos definidos para cada tipo de layout |
| Mapeamento criador em grupo de campos | Jhollyfer | 29/03/2026 | Commit f62da18 |
