# Especificação de Permissões — LowCode.js

## Visão Geral

É uma revisão geral no esquema de permissões do framework. Propõe um esquema de permissões baseado no RBAC (Role-Based Access Control). Engloba a tabela, campos, o menu e opções em sistema.

O modelo possui 5 camadas de permissão que atuam em conjunto:

1. **Grupos de Usuários** — Permissões globais do sistema (RBAC)
2. **Permissões da Tabela** — Ações por tabela vinculadas a grupos
3. **Perfis de Colaboração da Tabela** — Controle granular por convidado dentro da tabela
4. **Permissões do Menu** — Visibilidade de cada opção do menu
5. **Permissões do Campo** — Visibilidade do campo por contexto (lista/formulário/detalhes)

---

## 1. Grupos de Usuários (RBAC Global)

### Conceito

Os papéis atribuídos a cada grupo de usuários controlam o acesso para as principais áreas do sistema e suas ações. Um usuário pode pertencer a **vários grupos simultaneamente**.

### Grupo Super Admin / Master

- Possui **todos** os papéis habilitados.
- **Não é possível editar** suas permissões (são fixas e imutáveis).
- Pode excluir tabelas permanentemente (exclusão definitiva).

### Mecanismo "Engloba"

A opção "Engloba" permite que um grupo englobe usuários de outros grupos. Isso significa que se uma opção do menu estiver como Registered e o usuário for Manager, como Manager engloba Registered, o usuário do grupo Manager vai conseguir acessar.

**Regra de resolução:**

```
Tabela X → Para acessar, precisa pertencer ao Grupo Y
Usuário A → Pertence ao Grupo Z, que Engloba o Grupo Y
Resolução → Grupos pertencentes: Z, Y
Resultado → Usuário A pode acessar a Tabela X
```

Esses relacionamentos simulam níveis de acesso e abrem possibilidade para cenários mais complexos. O cenário mais corriqueiro é criar grupos com Registered e Manager vinculados.

### Hierarquia Padrão dos Grupos

| Grupo         | Grupo Pai     | Herda (Engloba)                    | Ver Tabelas | Criar Tabelas | Editar Tabelas | Remover Tabelas                | Usuários     | Menu | Grupos de Usuários | Configurações | Ferramentas | Plugins |
| ------------- | ------------- | ---------------------------------- | ----------- | ------------- | -------------- | ------------------------------ | ------------ | ---- | ------------------ | ------------- | ----------- | ------- |
| Super Admin   | Administrator | Administrator, Manager, Registered | sim         | sim           | sim            | sim (pode excluir para sempre) | sim          | sim  | sim                | sim           | sim         | sim     |
| Administrator | Manager       | Manager, Registered                | sim         | sim           | sim            | sim                            | apenas a sua | sim  | nao                | nao           | nao         | nao     |
| Manager       | Registered    | Registered                         | sim         | sim           | apenas a sua   | apenas a sua                   | nao          | nao  | nao                | nao           | nao         | nao     |
| Registered    | —             | —                                  | sim         | nao           | nao            | nao                            | nao          | nao  | nao                | nao           | nao         | nao     |

**Nota:** Com exceção das tabelas, "sim" significa poder realizar **todas** as ações disponíveis na tela (adicionar, ver, editar e apagar).

### Grupos Customizados

Além dos grupos padrão, é possível criar grupos customizados para cenários específicos.

**Exemplo 1: Grupo Vendas**

- Mesmas permissões globais de Registrado.
- Pode atualizar a tabela de Contatos Realizados.
- Não pode acessar tabelas do Financeiro.

**Exemplo 2: Vendas-Consultores vs Vendas-Admin**

- Vendas-Consultores: apenas cria novos registros.
- Vendas-Admin: gerencia todos os registros.

### Interface — Editar Grupo de Usuários

Tela: "Detalhes do grupo" com botão "Editar" no canto superior direito.

Campos:

- **Slug (identificador):** Identificador único do grupo (ex: "Dono").
- **Nome:** Nome de exibição (ex: "Master").
- **Descrição:** Texto descritivo (ex: "Acesso total ao sistema – gerencia tudo, incluindo configurações do sistema").
- **Permissões:** Grade com as colunas: Ver Tabelas, Criar Tabelas, Editar Tabelas, Remover Tabelas, Usuários, Menu, Grupos de Usuários, Configurações, Ferramentas, Plugins.
- **Grupos vinculados (Engloba):** Componente de escolha tipo **relacionamento múltiplo**. Hoje está usando tags (ex: tag "Registered"), mas o componente deve ser diferente — deve ser um seletor de relacionamento múltiplo, não tags simples.

Ações: Botão "Voltar".

### Menu Lateral (Sistema)

O menu lateral do sistema possui as seguintes opções na seção "Sistema":

- Tabelas
- Configurações
- Menus
- Grupos
- Usuários
- Ferramentas

---

## 2. Permissões da Tabela

### Conceito

Ao editar as configurações da tabela, os **grupos** são vinculados às ações da tabela. Cada ação possui um dropdown com as seguintes opções:

- **Grupo específico** — Apenas usuários daquele grupo (e grupos que o englobam) podem realizar a ação.
- **Public** — Usuários **não logados** podem realizar a ação.
- **Nobody** — **Nenhum** grupo pode realizar aquela ação (bloqueio total).

Dessa maneira, um grupo pode apenas inserir itens enquanto outro pode gerenciar todos os registros e os campos.

### Substituição do Modelo Antigo

Os campos antigos são **removidos** e substituídos pelo novo modelo de permissões:

- ~~Visibilidade~~ → Substituído pelas ações View table / View row
- ~~Colaboração~~ → Substituído pelas ações Create/Update/Remove row
- ~~Administradores~~ → Substituído pelo campo Dono + ações de campo/tabela

### Ações da Tabela (10 ações)

| Ação         | Descrição                                |
| ------------ | ---------------------------------------- |
| View table   | Visualizar a tabela (acessar a listagem) |
| Update table | Atualizar configurações da tabela        |
| Create field | Criar novos campos na tabela             |
| Update field | Editar campos existentes                 |
| Remove field | Remover campos da tabela                 |
| View field   | Visualizar campos da tabela              |
| Create row   | Criar novos registros                    |
| Update row   | Atualizar registros existentes           |
| Remove row   | Remover registros                        |
| View row     | Visualizar registros individuais         |

### Dono da Tabela

- Cada tabela possui um **dono** (pode ser um usuário, ex: "Oliveira").
- Deve ser possível **trocar o dono** na edição da tabela.

### Exemplos de Uso

**Tabela Filiais — View table = Public:**
Um usuário não logado pode consultar o telefone e endereço de uma Filial, mas não pode realizar nenhuma outra ação.

**Tabela Pesquisa de Satisfação — Create row = Public:**
É público adicionar um registro (preencher e enviar o formulário), mas não é possível acessar/visualizar a tabela com os dados.

**Tabela Contatos — Cenário Vendas:**
Grupo Vendas-Consultores só pode Create row. Grupo Vendas-Admin tem Update row e Remove row. Grupo Financeiro não tem nenhuma permissão nesta tabela.

### Interface — Editar Tabela

Tela: "Detalhes da tabela" com seta de voltar.

Campos mantidos:

- **Nome:** Nome da tabela (ex: "Clientes", com ícone de tabela)
- **Descrição:** Textarea (placeholder: "Digite uma descrição para a tabela")
- **Layout de visualização:** Dropdown (ex: "Lista")

Campos removidos:

- ~~Visibilidade~~
- ~~Colaboração~~
- ~~Administradores~~

Campos novos — **Grade de permissões** (primeira linha):

| View table | Update table | Create field | Update field | Remove field |
| ---------- | ------------ | ------------ | ------------ | ------------ |
| Public     | Master       | Master       | Master       | Master       |

**Grade de permissões** (segunda linha):

| View field | Create row | Update row | Remove row | View row |
| ---------- | ---------- | ---------- | ---------- | -------- |
| Registered | Registered | Manager    | Manager    | Public   |

No dropdown de cada ação, além dos **grupos**, deve aparecer as opções **Public** e **Nobody**.

Campo adicional:

- **Don (Dono):** Dropdown/seletor para trocar o dono da tabela (ex: "Oliveira"). Deve ser possível trocar o dono do grupo.

Ações: Botões "Cancelar" e "Salvar".

---

## 3. Perfis de Colaboração da Tabela (Convidados)

### Conceito

Dentro de cada tabela, existem **perfis de usuários (convidados)** que definem o que cada participante pode fazer. Esses perfis controlam o acesso granular às ações da tabela no nível de colaboração.

**Nota importante:** Permissões válidas apenas para os grupos **Registered** e **Manager**. Grupos superiores (Super Admin, Administrator) já possuem acesso completo via permissões globais.

**Nota:** O ideal é permitir gerenciar esses perfis dinamicamente no futuro.

### Perfis e suas Permissões

| Perfil      | View table | Update table | Create field | Update field | Remove field | View field | Create row | Update row       | Remove row       | View row |
| ----------- | ---------- | ------------ | ------------ | ------------ | ------------ | ---------- | ---------- | ---------------- | ---------------- | -------- |
| owner       | sim        | sim          | sim          | sim          | sim          | sim        | sim        | sim              | sim              | sim      |
| admin       | sim        | nao          | sim          | sim          | sim          | sim        | sim        | sim              | sim              | sim      |
| editor      | sim        | nao          | nao          | nao          | nao          | nao        | sim        | sim              | sim              | sim      |
| contributor | sim        | nao          | nao          | nao          | nao          | nao        | sim        | **apenas a sua** | **apenas a sua** | sim      |
| viewer      | sim        | nao          | nao          | nao          | nao          | nao        | sim        | sim              | sim              | sim      |

**"apenas a sua":** O contributor só pode atualizar e remover registros que **ele próprio criou** (row-level security).

### Permissões de Colaboração da Tabela

Define quem pode realizar cada tipo de ação, segmentado por nível de relação com a tabela:

| Ação                   | Opção 1 (mais restrita) | Opção 2           | Opção 3 (mais aberta) |
| ---------------------- | ----------------------- | ----------------- | --------------------- |
| View table e View row  | Dono e convidados       | Registered        | Visitante             |
| Create Row             | Dono e convidados       | Registered        | Visitante             |
| Outras ações da tabela | Dono e convidados       | Dono e convidados | Dono e convidados     |

**Definição dos níveis:**

- **Dono e convidados:** Apenas o dono da tabela e usuários explicitamente convidados com um perfil.
- **Registered:** Qualquer usuário logado com perfil Registered (ou grupo que engloba Registered). Equivale ao usuário logado.
- **Visitante:** Usuário não logado (acesso público).

### Notas sobre Colaboração

- Caso de uso: grupo de usuários precisam acessar uma opção e as tabelas abaixo.
- Se for apenas um separador, deve ser similar à gestão dos perfis da tabela, na qual os usuários são convidados e tem a parte da colaboração.
- A opção de menu que é uma lista deve usar as permissões da lista para mostrar ou não a opção.

---

## 4. Permissões do Menu

### Conceito

Cada item do menu possui uma configuração de **visibilidade** que controla qual grupo pode ver aquela opção. A visibilidade determina o grupo que pode ver a opção do menu.

### Opções de Visibilidade

| Campo        | Valor                                          |
| ------------ | ---------------------------------------------- |
| Visibilidade | Escolha um **Grupo** / **Public** / **Nobody** |

### Regra de Resolução

A resolução segue a mesma lógica do "Engloba":

- Se o menu está configurado para o grupo "Registered" e o usuário pertence ao grupo "Manager" que engloba "Registered", o usuário **consegue ver** o menu.
- Se o menu está como "Public", qualquer pessoa (logada ou não) pode ver.
- Se o menu está como "Nobody", ninguém vê aquela opção.

### Notas

- Caso de uso: grupo de usuários precisam acessar uma opção e as tabelas abaixo.
- Se for apenas um separador, deve ser similar à gestão dos perfis da tabela, na qual os usuários são convidados e tem a parte da colaboração.
- A opção de menu que é uma lista deve usar as permissões da lista para mostrar ou não a opção.

### Interface — Editar Opção do Menu

Tela: "Detalhes do menu" com seta de voltar.

Campos:

- **Nome:** Nome do item de menu (ex: "Clientes", com ícone de documento).
- **Tipo \*:** Tipo do menu (ex: "Tabela"). Campo obrigatório.
- **Menu Pai:** Dropdown para selecionar menu pai (ex: "Nenhum (raiz)", com ícone de hierarquia).
- **Tabela \*:** Tabela vinculada (ex: "Clientes"). Campo obrigatório.
- **Grupo:** Seletor de grupo (ex: tag "Registered"). Define o **grupo que pode ver a opção do menu**. Dropdown com lista de **Grupos** + **Public** + **Nobody**.

Ações: Botões "Cancelar" e "Salvar".

---

## 5. Permissões do Campo

### Conceito

Cada campo possui 3 contextos de visibilidade. Cada contexto é controlado por um **grupo** (os mesmos grupos globais do sistema, como Registrado, Gerente, Administrador) ou pode ser marcado como **oculto**. O grupo define quem pode fazer essa ação no campo, com **impacto direto no formulário**.

**Importante:** As permissões do campo usam **grupos do sistema** (Seção 1), definindo qual grupo pode realizar a ação no campo.

### Contextos de Permissão

| Contexto                         | Descrição                                  | Valor                                                   |
| -------------------------------- | ------------------------------------------ | ------------------------------------------------------- |
| Visibilidade Adicionar (List)    | Quem vê o campo ao adicionar / na listagem | **Oculto** ou escolher o **perfil de usuário da lista** |
| Visibilidade Editar (Formulário) | Quem vê o campo no formulário de edição    | **Oculto** ou escolher o **perfil de usuário da lista** |
| Visibilidade Detalhes            | Quem vê o campo na tela de detalhes        | **Oculto** ou escolher o **perfil de usuário da lista** |

### Exemplo

Para um campo "CPF" (conforme mockup):

| Contexto   | Grupo atribuído | Efeito                                                                            |
| ---------- | --------------- | --------------------------------------------------------------------------------- |
| List       | Registrado      | Qualquer usuário logado (Registered ou superior) vê o CPF na listagem             |
| Formulário | Gerente         | Apenas gerentes (Manager ou superior) veem o CPF no formulário de edição          |
| Detalhes   | Administrador   | Apenas administradores (Administrator ou superior) veem o CPF na tela de detalhes |

### Interface — Editar Campo

Tela: "Detalhes do campo" com seta de voltar.

Campos existentes:

- **Nome \*:** Nome do campo (ex: "CPF", com ícone de documento). Campo obrigatório.
- **Tipo:** Tipo do campo (ex: "Texto"). Dropdown desabilitado/readonly.
- **Formato \*:** Formato do campo (ex: "Inteiro"). Dropdown obrigatório.
- **Valor padrão:** Texto livre (placeholder: "Valor padrão (deixe em branco se não houver)").
- **Obrigatoriedade:** Toggle Não/Sim (texto: "Este campo é obrigatório?").
- **Enviar para lixeira:** Toggle Não/Sim (texto: "Enviar este campo para a lixeira?").

Campos novos — **Grade de permissões** na parte inferior do formulário:

| List       | Formulário | Detalhes      |
| ---------- | ---------- | ------------- |
| Registrado | Gerente    | Administrador |

Cada coluna tem um seletor/tag mostrando o **grupo** atribuído. O dropdown contém: **Oculto** + lista dos **grupos do sistema**.

Nota da interface: "Grupo que pode fazer essa ação no campo. Impacto no formulário."

Ações: Botões "Cancelar" e "Salvar".

---

## 6. Editar Usuário

### Conceito

Um usuário pode pertencer a **vários grupos** simultaneamente. A associação é feita na edição do usuário, com componente de **múltipla seleção**.

### Resolução de Permissões do Usuário

```
1. Buscar todos os grupos diretos do usuário (user_groups)
2. Para cada grupo, resolver recursivamente o "engloba"
3. Resultado: conjunto completo de group_ids
4. Permissão final = UNIÃO de todas as permissões de todos os grupos no conjunto
```

### Exemplo

```
Usuário João:
  - Grupo direto: Vendas (engloba Registered)
  - Grupo direto: Suporte

Resolução:
  - Vendas → engloba Registered → group_ids: [Vendas, Registered]
  - Suporte → não engloba ninguém → group_ids: [Suporte]
  - Conjunto final: [Vendas, Registered, Suporte]

Permissão final: união das permissões de Vendas + Registered + Suporte
```

---

## 7. Fluxo Completo de Resolução de Permissões

### Acesso a uma Tabela (passo a passo)

```
1. IDENTIFICAR USUÁRIO
   → Está logado? Se não, tratar como "Public"

2. RESOLVER GRUPOS DO USUÁRIO
   → Buscar grupos diretos (user_groups)
   → Para cada grupo, resolver "engloba" recursivamente
   → Montar conjunto completo de group_ids

3. VERIFICAR PERMISSÃO GLOBAL (Grupo de Usuários — Seção 1)
   → Algum grupo do conjunto tem "Ver Tabelas"? Se nenhum tem → bloqueia

4. VERIFICAR PERMISSÃO DA TABELA (Seção 2, ação específica)
   → Se a ação está como "Public" → libera (mesmo não logado)
   → Se a ação está como "Nobody" → bloqueia
   → Se a ação tem um Grupo → verifica se o group_id está no conjunto do passo 2

5. VERIFICAR PERFIL DE COLABORAÇÃO (Seção 3, se aplicável)
   → Qual o perfil do usuário nesta tabela? (owner/admin/editor/contributor/viewer)
   → O perfil permite a ação? (consultar tabela de perfis da Seção 3)
   → Se "apenas a sua" → aplicar row-level security (só rows criadas pelo usuário)

6. VERIFICAR PERMISSÃO DO MENU (Seção 4)
   → A opção de menu vinculada tem visibilidade para o grupo do usuário?
   → Mesma lógica: Public / Nobody / Grupo com resolução de "engloba"
   → Se a opção do menu é uma lista, usar as permissões da lista para mostrar ou não

7. VERIFICAR PERMISSÃO DO CAMPO (Seção 5, por contexto)
   → No contexto atual (lista/formulário/detalhes):
     → Se oculto → não exibe o campo
     → Se tem grupo → verifica se algum group_id do usuário (com engloba) corresponde ao grupo exigido
```

---

## 8. Dúvidas em Aberto

Dúvidas anotadas na planilha que ainda precisam de definição:

1. **Escolher "viewer" deve englobar todos os outros perfis de usuário?** — Se eu defino que viewer pode ver um campo, automaticamente contributor, editor, admin e owner também podem? (hierarquia implícita: owner > admin > editor > contributor > viewer)
2. **Escolher "Registered" na colaboração deveria equivaler ao usuário logado e englobar todos os outros grupos de usuário?**
3. **Fazer grupos hierárquicos?** — A hierarquia dos perfis de colaboração (owner > admin > editor > contributor > viewer) é fixa no sistema ou deve ser configurável pelo admin?

---

## 9. Próximos Passos (Prototipação)

Itens de prototipação identificados:

1. Fazer a prototipação de **gestão para admin** (tela de gestão de grupos de usuários)
2. Fazer a prototipação da **edição da tabela** (novo formulário com grade de permissões substituindo visibilidade/colaboração/administradores)
3. Fazer a prototipação das **permissões do menu** (edição do menu com campo de grupo/visibilidade)

####

# Tabelas de Permissões

## Grupo / Acesso ao menu e ações

| Grupo         | Grupo Pai     | Herda                              | Ver Tabelas | Criar Tabelas | Editar Tabelas | Remover Tabelas                | Usuários     | Menu | Grupos de usuários | Configurações | Ferramentas | Plugins |
| ------------- | ------------- | ---------------------------------- | ----------- | ------------- | -------------- | ------------------------------ | ------------ | ---- | ------------------ | ------------- | ----------- | ------- |
| Super Admin   | Administrator | Administrator, Manager, Registered | sim         | sim           | sim            | sim (pode excluir para sempre) | sim          | sim  | sim                | sim           | sim         | sim     |
| Administrator | Manager       | Manager, Registered                | sim         | sim           | sim            | sim                            | apenas a sua | sim  | nao                | nao           | nao         | nao     |
| Manager       | Registered    | Registered                         | sim         | sim           | apenas a sua   | apenas a sua                   | nao          | nao  | nao                | nao           | nao         | nao     |
| Registered    |               |                                    | sim         | nao           | nao            | nao                            | nao          | nao  | nao                | nao           | nao         | nao     |

---

## Perfis de usuários da tabela (convidados)

| Perfil      | View table | Update table | Create field | Update field | Remove field | View field | Create row | Update row   | Remove row   | View row |
| ----------- | ---------- | ------------ | ------------ | ------------ | ------------ | ---------- | ---------- | ------------ | ------------ | -------- |
| owner       | sim        | sim          | sim          | sim          | sim          | sim        | sim        | sim          | sim          | sim      |
| admin       | sim        | nao          | sim          | sim          | sim          | sim        | sim        | sim          | sim          | sim      |
| editor      | sim        | nao          | nao          | nao          | nao          | nao        | sim        | sim          | sim          | sim      |
| contributor | sim        | nao          | nao          | nao          | nao          | nao        | sim        | apenas a sua | apenas a sua | sim      |
| viewer      | sim        | nao          | nao          | nao          | nao          | nao        | sim        | sim          | sim          | sim      |

---

## Permissões da tabela (colaboração)

| Ação                   | Opção 1           | Opção 2           | Opção 3           |
| ---------------------- | ----------------- | ----------------- | ----------------- |
| View table e view row  | Dono e convidados | Registered        | Visitante         |
| Create Row             | Dono e convidados | Registered        | Visitante         |
| Outras ações da tabela | Dono e convidados | Dono e convidados | Dono e convidados |

---

## Permissões do menu

| Permissões do menu | Grupo         |
| ------------------ | ------------- |
| Visibilidade       | Escolhe grupo |

---

## Permissões no campo

| Permissão              | Valor                                           |
| ---------------------- | ----------------------------------------------- |
| visibilidade adicionar | oculto ou escolher o perfil de usuário da lista |
| visibilidade editar    | oculto ou escolher o perfil de usuário da lista |
| visibilidade detalhes  | oculto ou escolher o perfil de usuário da lista |
