# Plano de Testes Estruturado – LowcodeJS

**Projeto:** LowcodeJS
**Ambiente:** develop
**Data de inicio:** 08/03/2026
**Ultima atualizacao:** 30/03/2026
**Responsavel pelos testes:** Lauriana

---

## 1. Legenda

| Simbolo | Significado                                                                                                                             |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| ✅      | Passou no teste                                                                                                                         |
| ❌      | Erro: requisito nao funciona e/ou apresenta tela de erro                                                                                |
| ⚠️      | Ajuste: pequena alteracao em funcionalidade existente para funcionar adequadamente, mas nao implica em percepcao de erro para o usuario |
| 🔁      | Correcao e retestar                                                                                                                     |
| 🆕      | Melhoria: nova funcionalidade                                                                                                           |
| ❓      | Erro nao confirmado ou Descartado                                                                                                       |

---

## 2. Listas (Tabelas)

### Exibicao de listas

- [ ] Listagem de tabelas
- [ ] Modo lista
- [ ] Paginacao
- [ ] Quantidade de registros por pagina
- [ ] Navegacao entre paginas
- [ ] Nome da tabela

#### Link

> ⚠️ Nao ha opcao para compartilhar o link da tabela. Anteriormente, era possivel clicar no link para copia-lo automaticamente. Alem disso, no menu de acoes, as unicas funcionalidades disponiveis sao exportacao, excluir e visualizar.
> 📝 **Obs:** Corrigir ortografia: _Acoes_

- [ ] Visibilidade
- [ ] Data de criacao
- [ ] Criada por

### Busca de listas

- [ ] Busca por nome

> ⚠️ A lista deveria ser apresentada independentemente da pagina em que se encontra. Por exemplo, se existem 100 listas distribuidas em 3 paginas, nao e razoavel exigir que o usuario insira o nome em cada pagina para realizar a busca. Alem de pouco funcional, essa abordagem nao e pratica do ponto de vista de usabilidade.

- [ ] Ignorar acentuacao
- [ ] Ignorar maiusculas/minusculas
- [ ] Busca parcial (LIKE)
- [ ] Busca com caracteres especiais

### Gestao de listas

- [ ] Criar nova lista
  - [ ] Nome longo (max. 40 caracteres)
  - [ ] Caracteres especiais
  - [ ] Nome duplicado
  - [ ] ⚠️ Manter todo o conteudo textual integralmente em portugues
  - [ ] Nome vazio (campo obrigatorio)
  - [ ] Cancelar criacao
- [ ] Editar nome
- [ ] Editar descricao

> 🔗 [https://develop.lowcodejs.org/tables/nova-lista-teste-lauriana/detail](https://develop.lowcodejs.org/tables/nova-lista-teste-lauriana/detail)
> 📎 `20260322_205442.mp4`

- [ ] Alterar visibilidade (PUBLIC, RESTRICTED, OPEN, FORM, PRIVATE)
- [ ] Alterar modo de colaboracao (OPEN, RESTRICTED)
- [ ] Alterar estilo de visualizacao (Lista, Galeria, Documento, Card, Mosaico, Kanban, Forum, Calendario, Gantt)
- [ ] Enviar para lixeira
- [ ] Restaurar da lixeira
- [ ] Excluir permanentemente
- [ ] Verificar exclusao de grupos de campos

> ❓ Como restaurar o grupo de campos enviados para a lixeira? Como e possivel criar novo campo na lixeira?

- [ ] Verificar exclusao de relacionamentos

---

## 3. Campos

### Criacao de campos

- [ ] Criar campo
- [ ] Editar campo
- [ ] Excluir campo
- [ ] Alterar obrigatoriedade
- [ ] Alterar ordem
- [ ] Usar no filtro
- [ ] Exibir na lista
- [ ] Exibir no formulario
- [ ] Exibir no detalhe

> ❌ **Bug na apresentacao**

- [ ] Validacao de obrigatorio

### Campo Texto Curto (TEXT_SHORT)

- [ ] Texto simples (ALPHA_NUMERIC)
- [ ] URL — ❌ **Bug na apresentacao** (limitar o texto da URL com "...")
- [ ] Email (EMAIL)
- [ ] Telefone (PHONE)
- [ ] CPF
- [ ] CNPJ
- [ ] Integer (INTEGER)
- [ ] Decimal (DECIMAL)
- [ ] Password
  - [ ] ❌ Apos editar o registro, a senha cadastrada sumiu
  - [ ] Ocultar valor digitado
  - [ ] Mostrar/ocultar senha

### Campo Texto Longo (TEXT_LONG)

- [ ] Texto simples (PLAIN_TEXT)
- [ ] Rich Text (RICH_TEXT) — Editor Tiptap WYSIWYG
- [ ] Renderizacao em visualizacao

### Campo Data (DATE)

- [ ] Data valida
- [ ] Data invalida
- [ ] Data fora do intervalo
- [ ] Ordenacao
- [ ] Filtro por periodo — ❌ **Nao possui filtro por data**
- [ ] Edicao
- [ ] Formatos suportados: DD/MM/YYYY, MM/DD/YYYY, YYYY/MM/DD (com e sem hora, com / e -)

### Campo Arquivo (FILE)

- [ ] Upload
- [ ] Multiplos arquivos
- [ ] Arquivos grandes
- [ ] Arquivo invalido
- [ ] Visualizacao na lista
- [ ] Visualizacao no registro
- [ ] Upload duplicado

### Campo Dropdown

- [ ] Uma opcao
- [ ] Multiplas opcoes
- [ ] Ordenacao das opcoes
- [ ] Edicao das opcoes
- [ ] Obrigatorio
- [ ] Uso em filtro

### Campo Relacionamento (RELATIONSHIP)

- [ ] Relacionamento 1:1
- [ ] Relacionamento 1:N
- [ ] Relacionamento N:N
- [ ] Adicionar item relacionado
- [ ] Remover item
- [ ] Consulta por relacionamento — ❌ **Opcao nao existe ou nao funciona**

### Campo Categoria (CATEGORY)

- [ ] Estrutura hierarquica (arvore)
- [ ] Selecao de itens
- [ ] Edicao de nos
- [ ] Adicionar nos filhos
- [ ] Uso em filtros

### Campo Avaliacao (EVALUATION)

- [ ] Inserir avaliacao (valor numerico)
- [ ] Alterar avaliacao
- [ ] Voto restrito — ⚠️ Deixar tudo em portugues
- [ ] Voto publico

### Campo Reacao (REACTION)

- [ ] Like/Unlike em registros
- [ ] Contagem de reacoes
- [ ] Restricao por autenticacao

### Campo Usuario (USER)

- [ ] Selecionar usuario existente
- [ ] Exibicao do nome do usuario no registro
- [ ] Uso em filtros

### Campo Grupo de Campos (FIELD_GROUP)

- [ ] Criar sub-tabela dentro de um campo
- [ ] CRUD de linhas dentro do grupo
- [ ] Exibicao no formulario do registro

### Campos Nativos (automaticos)

- [ ] CREATOR — usuario que criou o registro
- [ ] IDENTIFIER — ID automatico
- [ ] CREATED_AT — data de criacao
- [ ] TRASHED — flag de lixeira
- [ ] TRASHED_AT — data de exclusao

---

## 4. Itens (Registros)

- [ ] Criar registro
- [ ] Editar registro
- [ ] Excluir registro (soft delete)
- [ ] Restaurar registro da lixeira
- [ ] Excluir permanentemente
- [ ] Ordenar registros
- [ ] Filtro
- [ ] Busca
- [ ] Registro com todos os campos
- [ ] Registro com campos vazios
- [ ] Atualizacao apos edicao

### Operacoes em Massa

- [ ] Enviar multiplos registros para lixeira (bulk trash)
- [ ] Restaurar multiplos registros (bulk restore)

---

## 5. Permissoes

### Usuarios

- [ ] Criar usuario
- [ ] Editar usuario
- [ ] Alterar senha — ⚠️ Consigo alterar tanto como master quanto usuario, mas o mesmo nao perde o acesso se nao deslogar
- [ ] Alterar email
- [ ] Alterar status (ACTIVE/INACTIVE)
- [ ] Excluir usuario _(nao vejo necessidade)_
- [ ] Exibicao do usuario logado

### Grupos

- [ ] Criar grupo
- [ ] Editar grupo
- [ ] Alterar permissoes (12 permissoes: CREATE/UPDATE/REMOVE/VIEW para TABLE, FIELD, ROW)
- [ ] Excluir grupo — ❌ **Nao existe**

### Roles (RBAC)

- [ ] MASTER — acesso total
- [ ] ADMINISTRATOR — acesso a todas as tabelas
- [ ] MANAGER — CRUD respeitando ownership
- [ ] REGISTERED — VIEW + CREATE_ROW apenas

---

## 6. Visibilidade

- [ ] Lista publica (PUBLIC) — acesso sem login, somente visualizacao
- [ ] Lista restrita (RESTRICTED) — somente VIEW para nao-owners
- [ ] Lista aberta (OPEN) — VIEW + CREATE_ROW sem login
- [ ] Lista formulario (FORM) — criacao de registro sem login
- [ ] Lista privada (PRIVATE) — bloqueado para nao-owners
- [ ] Acesso sem login em listas publicas
- [ ] Acesso com login
- [ ] Acesso por perfil

### Colaboracao

- [ ] Modo aberto (OPEN) — qualquer um pode editar
- [ ] Modo restrito (RESTRICTED) — somente owner/admins

---

## 7. Grupo de Campos

- [ ] Criar grupo
- [ ] Vincular grupo a lista
- [ ] Editar grupo

> ❌ **Bug identificado:** ao editar o nome do grupo de campos, o sistema salva os novos campos mas nao os apresenta na interface — acredita-se que esta salvando apenas no banco.
> 📝 **Obs:** Apenas quando o nome e editado. Caso essa acao nao seja realizada, o sistema cria normalmente.

- [ ] Excluir grupo (enviar para lixeira)
- [ ] Restaurar grupo da lixeira
- [ ] Filtrar por grupo
- [ ] Exibicao em registros

---

## 8. Login e Autenticacao

- [ ] Login valido (email + senha)
- [ ] Senha invalida
- [ ] Espaco extra
- [ ] Logout
- [ ] Recuperacao de senha (via email)
- [ ] Login em multiplos dispositivos
- [ ] Redirecionamento apos login (dashboard para MASTER, rota padrao por role)

### Cadastro (Sign-up)

- [ ] Criar conta
- [ ] Validacao de campos obrigatorios
- [ ] Email duplicado

### Magic Link

- [ ] Enviar magic link por email
- [ ] Login via magic link

### Tokens

- [ ] Access Token (JWT RS256, 24h)
- [ ] Refresh Token (7 dias)
- [ ] Renovacao automatica de token

### Validacao de Codigo

- [ ] Solicitar codigo de validacao (request-code)
- [ ] Validar codigo (validate-code)
- [ ] Codigo expirado

---

## 9. Modelos de Visualizacao

### Lista (LIST)

- [ ] Exibicao de registros em colunas
- [ ] Movimentacao entre colunas (drag-drop)
- [ ] Campos configurados
- [ ] Redimensionamento de colunas
- [ ] Navegacao por teclado (setas)

### Documento (DOCUMENT)

- [ ] Exibicao de cards para cada registro
- [ ] Sidebar hierarquica (indice/TOC)
- [ ] Exibicao do campo Titulo como titulo do card
- [ ] Exibicao do campo Descricao no conteudo do card
- [ ] Abertura do registro ao clicar no card
- [ ] Exportacao em PDF
- [ ] Impressao

### Card (CARD)

- [ ] Exibicao de cards para cada registro
- [ ] Organizacao em grade dos cards
- [ ] Exibicao de titulo conforme campo configurado
- [ ] Exibicao de descricao conforme campo configurado
- [ ] Exibicao da imagem de capa quando houver
- [ ] Abertura do registro ao clicar no card

> 🔗 [https://develop.lowcodejs.org/tables/projetos-de-ti/row/69b7589bb62d8d81392c56bd](https://develop.lowcodejs.org/tables/projetos-de-ti/row/69b7589bb62d8d81392c56bd)

### Mosaico (MOSAIC)

- [ ] Exibicao de cards para cada registro
- [ ] Organizacao em grade dos cards
- [ ] Exibicao de titulo conforme campo configurado
- [ ] Exibicao de descricao conforme campo configurado
- [ ] Exibicao da imagem de capa quando houver
- [ ] Abertura do registro ao clicar no card

> ❌ **Erro apresentado:** [https://develop.lowcodejs.org/tables/projetos-de-ti/row/69b7589bb62d8d81392c56bd](https://develop.lowcodejs.org/tables/projetos-de-ti/row/69b7589bb62d8d81392c56bd)

### Galeria (GALLERY)

- [ ] Exibicao de cards para cada registro
- [ ] Carregamento da capa (imagem) de cada registro
- [ ] Organizacao visual das imagens em grade
- [ ] Abertura do registro ao clicar na imagem

> ❌ **Erro apresentado:** [https://develop.lowcodejs.org/tables/projetos-de-ti/row/69b76d060bfab9ba9d54e235](https://develop.lowcodejs.org/tables/projetos-de-ti/row/69b76d060bfab9ba9d54e235)

### Kanban (KANBAN)

- [ ] Exibicao de colunas por campo dropdown
- [ ] Cards por registro dentro de cada coluna
- [ ] Drag-and-drop de cards entre colunas
- [ ] Adicionar nova coluna/lista
- [ ] Adicionar card diretamente no kanban
- [ ] Editar card inline
- [ ] Abrir detalhe do registro a partir do card
- [ ] Acoes rapidas no card

### Forum (FORUM)

- [ ] Listagem de canais
- [ ] Criar canal
- [ ] Editar canal
- [ ] Excluir canal
- [ ] Enviar mensagem em canal
- [ ] Selecionar usuarios participantes
- [ ] Visualizacao de documento dentro do forum

### Calendario (CALENDAR)

- [ ] Visualizacao mensal
- [ ] Visualizacao semanal
- [ ] Visualizacao agenda
- [ ] Criar evento (registro) no calendario
- [ ] Excluir evento
- [ ] Navegacao entre meses/semanas
- [ ] Toolbar de controles

### Gantt (GANTT)

- [ ] Exibicao de timeline
- [ ] Barras de progresso por registro
- [ ] Painel lateral com lista de registros
- [ ] Header de timeline (datas)
- [ ] Toolbar de controles

---

## 10. Performance

### Volume de dados

- [ ] Teste com 100.000 registros
- [ ] Teste com 1.000.000 registros
- [ ] Teste com 10.000.000 registros

### Carga de usuarios

- [ ] 10 usuarios simultaneos
- [ ] 100 usuarios
- [ ] 1.000 usuarios

### Operacoes

- [ ] Busca
- [ ] Filtro
- [ ] Insercao de registros

---

## 11. Seguranca

- [ ] Autenticacao (JWT RS256)
- [ ] Permissoes de acesso (RBAC 4 roles)
- [ ] Protecao de rotas
- [ ] Validacao de API (Zod + AJV)
- [ ] Controle de CORS
- [ ] Cookies httpOnly + secure
- [ ] Refresh token separado do access token

---

## 12. Configuracoes do Sistema

- [ ] Alterar nome do sistema (SYSTEM_NAME)
- [ ] Alterar logo (pequeno e grande)
- [ ] Alterar locale (pt-br, en-us)
- [ ] Configurar limites de upload (tamanho, tipos aceitos, max arquivos)
- [ ] Configurar paginacao padrao
- [ ] Configurar driver de storage (local/S3)
- [ ] Configurar provedor de email (SMTP)
- [ ] Selecionar tabelas modelo para clonagem (MODEL_CLONE_TABLES)
- [ ] Persistencia

---

## 13. Gestao de Menus

### Listagem

- [ ] Exibir menus cadastrados
- [ ] Colunas: Nome, Slug, Tipo, Criado por, Criado em
- [ ] Ordenacao de colunas _(nao vejo necessidade)_
- [ ] Paginacao
- [ ] Exibicao correta do tipo

### Tipos de Menu

- [ ] TABLE — vincula a uma tabela
- [ ] PAGE — pagina HTML customizada
- [ ] FORM — formulario de tabela
- [ ] EXTERNAL — link externo (URL)
- [ ] SEPARATOR — separador visual

### Busca

- [ ] Buscar por nome
- [ ] Buscar por slug
- [ ] Ignorar maiusculas/minusculas
- [ ] Busca parcial

### Criacao

- [ ] Criar menu
- [ ] Informar nome
- [ ] Informar slug
- [ ] Selecionar tipo
- [ ] Selecionar tabela vinculada (para TABLE/FORM)
- [ ] Inserir URL (para EXTERNAL)
- [ ] Inserir HTML (para PAGE)
- [ ] Selecionar menu pai (hierarquia)
- [ ] Salvar
- [ ] Cancelar
- [ ] Validacao nome vazio
- [ ] Validacao slug duplicado — ⚠️ Deixar tudo em portugues
- [ ] Caracteres especiais

### Edicao

- [ ] Editar nome
- [ ] Editar slug
- [ ] Alterar tipo
- [ ] Salvar edicao
- [ ] Cancelar edicao

### Exclusao (Lixeira)

- [ ] Enviar menu para lixeira (soft delete)
- [ ] Restaurar menu da lixeira
- [ ] Excluir menu permanentemente (hard delete)
- [ ] Confirmar exclusao

### Reordenacao

- [ ] Reordenar menus via drag-and-drop
- [ ] Ordem persistida apos salvamento

### Navegacao

- [ ] Acessar menu criado
- [ ] Redirecionamento para tabela vinculada
- [ ] Respeitar permissoes
- [ ] Menu hierarquico (pai/filho)

---

## 14. Clonar Modelo de Tabela

### Selecao do modelo

- [ ] Abrir dropdown
- [ ] Listar modelos (configurados em Settings: MODEL_CLONE_TABLES)
- [ ] Selecionar modelo existente

### Criacao da nova tabela

- [ ] Informar nome
- [ ] Clonar modelo
- [ ] Verificar criacao da tabela

### Validacao

- [ ] Sem modelo base
- [ ] Sem nome da tabela
- [ ] Nome duplicado
- [ ] Caracteres especiais

### Estrutura clonada

- [ ] Campos clonados
- [ ] ❌ Fui em ferramentas: "clonar a lista" e ele pegou o campo da lixeira
- [ ] Tipos mantidos
- [ ] Relacionamentos mantidos
- [ ] Grupos de campos clonados
- [ ] Registros **NAO** clonados (apenas estrutura)

### Funcionamento

- [ ] Criar registros
- [ ] Editar registros
- [ ] Excluir registros
- [ ] Aplicar filtros
- [ ] Aplicar ordenacao

---

## 15. Import/Export de Tabelas

### Importar Tabela

- [ ] Importar estrutura e dados de tabela
- [ ] Validacao do formato de importacao
- [ ] Tratamento de erros na importacao

### Exportar Tabela

- [ ] Exportar estrutura e dados de tabela
- [ ] Formato de exportacao valido
- [ ] Exportar tabela com registros

---

## 16. Dashboard

- [ ] Exibicao de graficos (tabelas)
- [ ] Exibicao de graficos (usuarios)
- [ ] Atividade recente
- [ ] Cards de estatisticas
- [ ] Acesso restrito (MASTER apenas)

---

## 17. Perfil do Usuario

- [ ] Visualizar dados do perfil
- [ ] Editar nome
- [ ] Editar email
- [ ] Alterar senha propria
- [ ] Atualizacao persistida

---

## 18. Paginas Customizadas

- [ ] Visualizar pagina por slug (menu type=PAGE)
- [ ] Renderizacao de conteudo HTML
- [ ] Acesso respeitando permissoes do menu

---

## 19. Chat IA

- [ ] Abrir painel de chat
- [ ] Enviar mensagem
- [ ] Receber resposta da IA (OpenAI)
- [ ] Indicador de "pensando"
- [ ] Tool calls (MCP)
- [ ] Enviar imagens (base64)
- [ ] Enviar PDFs (text extraction)
- [ ] Autenticacao via cookie JWT
- [ ] Eventos em tempo real (Socket.IO)

---

## 20. Scripts/Sandbox (Metodos da Tabela)

- [ ] Configurar script onLoad (carregamento_formulario)
- [ ] Configurar script beforeSave (antes_salvar)
- [ ] Configurar script afterSave (depois_salvar)
- [ ] Editor de codigo (Monaco)
- [ ] Timeout de 5 segundos
- [ ] API `field` — get/set/getAll campos
- [ ] API `context` — action, moment, userId, isNew, table
- [ ] API `email` — send, sendTemplate
- [ ] API `utils` — today, now, formatDate, sha256, uuid
- [ ] API `console` — log, warn, error (capturados)
- [ ] Bloqueio de acesso a globals (require, fs, network)

---

## 21. Outros Testes

- [ ] Redirecionamento para dashboard ao logar
- [ ] Exibicao de IDs em campos
- [ ] Campos nativos
- [ ] Interface em diferentes navegadores
- [ ] SEO — robots.txt e sitemap.xml
- [ ] Health check endpoint

---

## 22. Implementar

- [x] Quando o campo for enviado para a lixeira, o mesmo deve ficar como **nao obrigatorio** — ✅ Implementado (`send-to-trash` define `required: false`)

---

## 23. Resumo de Pendencias Conhecidas

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
| P14 | 🔁 Reteste  | Busca de listas restrita a pagina atual — backend ja suporta busca global | Reteste |
| P15 | ⚠️ Ajuste   | Textos em ingles na interface                                | Aberto     |
| P16 | ✅ Resolvido | ~~Campo enviado a lixeira deve se tornar nao obrigatorio~~ — send-to-trash define required: false | Implementado |
| P17 | 🔁 Reteste | ~~Restauracao de grupos de campos da lixeira~~ — Backend tem endpoint restore implementado | Reteste |
| P18 | ❌ Bug      | Funcao maskPasswordFields() no backend existe mas nao e chamada — hash exposto na API | Aberto |
| P19 | ❌ Ausente  | Dashboard utiliza dados mock em vez de dados reais da API    | Aberto     |
| P20 | 🆕 Melhoria | Campo arquivo: salvar URL relativa no banco (base + relativo para migracao) | Aberto |
| P21 | 🆕 Melhoria | Grupo de campos: replicar interface de tabelas na pagina de detalhes | Aberto |
| P22 | 🆕 Melhoria | Grupo de campos: visibilidade configuravel na tela de edicao do campo | Aberto |
| P23 | ⚠️ Ajuste   | Menu: ordenacao dentro do mesmo nivel hierarquico via dropdown "Exibir depois de" | Aberto |
| P24 | 🆕 Melhoria | Menu: definir opcao como home do sistema                     | Aberto     |
| P25 | 🆕 Melhoria | Configuracao para ativar/desativar assistente de IA          | Aberto     |
| P26 | 🆕 Melhoria | Migrations automaticas a cada nova instalacao                | Aberto     |
| P27 | 🆕 Melhoria | Migrar storage para MinIO                                    | Aberto     |
| P28 | ❌ Bug      | Campo Criador nao aparece no Grupo de Campos                 | Aguardando |
| P29 | ❌ Bug      | Largura de campo no grupo de campos nao reflete na listagem  | Aberto     |
| P30 | ❌ Bug      | Texto rico com cor branca mostra codigo HTML ao visualizar    | Aberto     |
| P31 | ❌ Bug      | Tag nao permite alterar a cor                                | Aberto     |
| P32 | ❌ Bug      | Ordenacao de campos nativos nao reflete em detalhes          | Aberto     |
| P33 | ❌ Bug      | Dados persistidos apos exclusao permanente — registros antigos voltam ao recriar com mesmo nome | Aberto |
| P34 | ❌ Bug      | Botao voltar na edicao de tabela redireciona para listagem geral | Aberto |
| P35 | 🔁 Reteste | Editar descricao redireciona para menu geral — report 22/03 indica correcao | Reteste |
| P36 | ❌ Bug      | Erro React minified ao abrir aplicacao — atrapalha Cypress   | Aberto     |
| P37 | ⚠️ Ajuste   | Visibilidade "Publica" e "Formulario" sem acentuacao         | Aberto     |
| P38 | 🆕 Melhoria | Permitir alterar slug da tabela (minusculo, normalizado, unico) | Aberto |
| P39 | 🆕 Melhoria | Opcao dropdown editavel (duplo clique, propagar para registros) | Aberto |
| P40 | 🆕 Melhoria | Esvaziar lixeira para todas as tabelas                       | Aberto     |
| P41 | 🆕 Melhoria | IDs para campos dos formularios (slug-tabela-slug-campo)     | Aberto     |
| P42 | 🆕 Melhoria | Markdown para texto longo e pagina com toggle codigo/formatado | Aberto |
| P43 | 🔁 Reteste | Configuracao campos default para layouts — report 22/03 indica mapeamento | Reteste |
| P44 | 🆕 Melhoria | Valor default para campos (dropdown e demais)                | Aberto     |
| P45 | 🆕 Melhoria | Campo relacionamento: adicionar novo registro inline via modal | Aberto |
| P46 | 🆕 Melhoria | Campo dropdown: permitir usuario inserir novas tags          | Aberto     |
| P47 | 🆕 Melhoria | Import/Export via CSV                                        | Aberto     |
| P48 | 🆕 Melhoria | Notificacoes e Websocket (tempo real)                        | Aberto     |
| P49 | 🆕 Melhoria | Formularios de gestao: 2 campos por linha                    | Aberto     |
| P50 | 🆕 Melhoria | Ao criar campo, exibir no final da lista                     | Aberto     |
| P51 | ⚠️ Ajuste   | Mensagem de campo duplicado nao exibida                      | Aberto     |
| P52 | 🆕 Melhoria | Link "Esqueceu a senha" na tela de login                     | Aberto     |
| P53 | 🆕 Melhoria | Filtros em barra lateral estilo e-commerce                   | Aberto     |
| P54 | 🆕 Melhoria | 2 conexoes MongoDB (nativas vs dados do usuario)             | Aberto     |
| P55 | 🆕 Melhoria | Tabelas/campos via arquivo de migrations                     | Aberto     |
| P56 | 🆕 Melhoria | Agendamentos CRON/Jobs                                       | Aberto     |
| P57 | 🆕 Melhoria | User Metadata — tabela estender metadados do usuario         | Aberto     |
| P58 | 🆕 Melhoria | Dicas do campo (tooltip no formulario)                       | Aberto     |
| P59 | 🆕 Melhoria | Log de acoes dos usuarios                                    | Aberto     |
| P60 | 🆕 Melhoria | Tabela e campos multilinguais                                | Aberto     |
| P61 | 🆕 Melhoria | Campos nativos para grupo de campos (ID, Created-by, Created-date) | Aberto |
| P62 | 🆕 Melhoria | Detalhes: definicao de tamanho de largura                    | Aberto     |
| P63 | 🆕 Melhoria | Referencia a IA e MCP no site                                | Aberto     |
| P64 | 🆕 Melhoria | Referencia ao Headless CMS no site                           | Aberto     |
| P65 | 🆕 Melhoria | Configurar Docker nos ambientes Coolify                      | Aberto     |
| P66 | 🆕 Melhoria | Configurar Redis                                             | Aberto     |
| P67 | 🆕 Melhoria | Configurar Websocket                                         | Aberto     |
