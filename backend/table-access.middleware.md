# ✅ **CHECKLIST COMPLETO - O QUE ESTÁ OK NO MIDDLEWARE**

## 🎯 **1. ESQUEMA DE PERMISSÕES DA LISTA (Matriz de Visibilidade)**

### ✅ **PRIVADA**

| Ação                    | Regra                    | Status |
| ----------------------- | ------------------------ | ------ |
| Ver a lista             | Apenas dono e convidados | ✅ OK  |
| Adicionar registro      | Apenas dono e convidados | ✅ OK  |
| Editar/apagar registros | Apenas dono e convidados | ✅ OK  |
| Gerenciar campos        | Apenas dono e convidados | ✅ OK  |

**Implementação:** Bloqueio geral no início valida tudo para tabelas privadas.

---

### ✅ **RESTRITA**

| Ação                    | Regra                    | Status |
| ----------------------- | ------------------------ | ------ |
| Ver a lista             | Usuário logado           | ✅ OK  |
| Adicionar registro      | Apenas dono e convidados | ✅ OK  |
| Editar/apagar registros | Apenas dono e convidados | ✅ OK  |
| Gerenciar campos        | Apenas dono e convidados | ✅ OK  |

**Implementação:**

- VIEW: Permite usuário logado
- CREATE_ROW: Bloqueia quem não é dono/admin
- UPDATE/REMOVE_ROW: Bloqueia quem não é dono/admin
- Campos: Bloqueia quem não é dono/admin

---

### ✅ **ABERTA**

| Ação                    | Regra                    | Status |
| ----------------------- | ------------------------ | ------ |
| Ver a lista             | Usuário logado           | ✅ OK  |
| Adicionar registro      | Usuário logado           | ✅ OK  |
| Editar/apagar registros | Apenas dono e convidados | ✅ OK  |
| Gerenciar campos        | Apenas dono e convidados | ✅ OK  |

**Implementação:**

- VIEW: Permite usuário logado
- CREATE_ROW: Permite usuário logado
- UPDATE/REMOVE_ROW: Bloqueia quem não é dono/admin
- Campos: Bloqueia quem não é dono/admin

---

### ✅ **PÚBLICA**

| Ação                    | Regra                          | Status |
| ----------------------- | ------------------------------ | ------ |
| Ver a lista             | Usuário não logado (visitante) | ✅ OK  |
| Adicionar registro      | Usuário logado                 | ✅ OK  |
| Editar/apagar registros | Apenas dono e convidados       | ✅ OK  |
| Gerenciar campos        | Apenas dono e convidados       | ✅ OK  |

**Implementação:**

- VIEW: Retorna antes da autenticação para visitantes
- CREATE_ROW: Permite usuário logado
- UPDATE/REMOVE_ROW: Bloqueia quem não é dono/admin
- Campos: Bloqueia quem não é dono/admin

---

### ✅ **FORMULÁRIO**

| Ação                    | Regra                          | Status |
| ----------------------- | ------------------------------ | ------ |
| Ver a lista             | Apenas dono e convidados       | ✅ OK  |
| Adicionar registro      | Usuário não logado (visitante) | ✅ OK  |
| Editar/apagar registros | Apenas dono e convidados       | ✅ OK  |
| Gerenciar campos        | Apenas dono e convidados       | ✅ OK  |

**Implementação:**

- VIEW: Bloqueia quem não é dono/admin
- CREATE_ROW: Retorna antes da autenticação para visitantes
- UPDATE/REMOVE_ROW: Bloqueia quem não é dono/admin
- Campos: Bloqueia quem não é dono/admin

---

## 🎯 **2. ESQUEMA DE PERMISSÕES DE USUÁRIOS (Grupos)**

### ✅ **SUPER ADMIN (MASTER)**

| Permissão            | Regra | Status |
| -------------------- | ----- | ------ |
| Criar tabela         | Sim   | ✅ OK  |
| Atualizar tabela     | Sim   | ✅ OK  |
| Remover tabela       | Sim   | ✅ OK  |
| Visualizar tabela    | Sim   | ✅ OK  |
| Gerenciar campos     | Sim   | ✅ OK  |
| Criar registros      | Sim   | ✅ OK  |
| Editar registros     | Sim   | ✅ OK  |
| Remover registros    | Sim   | ✅ OK  |
| Visualizar registros | Sim   | ✅ OK  |

**Implementação:** `isMaster` bypassa todas as validações de ownership.

---

### ✅ **ADMINISTRATOR**

| Permissão            | Regra | Status |
| -------------------- | ----- | ------ |
| Criar tabela         | Sim   | ✅ OK  |
| Atualizar tabela     | Sim   | ✅ OK  |
| Remover tabela       | Sim   | ✅ OK  |
| Visualizar tabela    | Sim   | ✅ OK  |
| Gerenciar campos     | Sim   | ✅ OK  |
| Criar registros      | Sim   | ✅ OK  |
| Editar registros     | Sim   | ✅ OK  |
| Remover registros    | Sim   | ✅ OK  |
| Visualizar registros | Sim   | ✅ OK  |

**Implementação:** `isAdminGroup` bypassa todas as validações de ownership.

---

### ✅ **MANAGER**

| Permissão            | Regra                                    | Status |
| -------------------- | ---------------------------------------- | ------ |
| Criar tabela         | Sim (qualquer tabela)                    | ✅ OK  |
| Atualizar tabela     | Somente tabelas próprias ou onde é admin | ✅ OK  |
| Remover tabela       | Somente tabelas próprias ou onde é admin | ✅ OK  |
| Visualizar tabela    | Sim                                      | ✅ OK  |
| Gerenciar campos     | Somente tabelas próprias ou onde é admin | ✅ OK  |
| Criar registros      | Sim                                      | ✅ OK  |
| Editar registros     | Somente tabelas próprias ou onde é admin | ✅ OK  |
| Remover registros    | Somente tabelas próprias ou onde é admin | ✅ OK  |
| Visualizar registros | Sim                                      | ✅ OK  |

**Implementação:**

- CREATE_TABLE: Sem restrição
- UPDATE/REMOVE_TABLE: Valida `isOwnerOrTableAdmin`
- Campos: Valida `isOwnerOrTableAdmin`
- UPDATE/REMOVE_ROW: Valida `isOwnerOrTableAdmin`
- VIEW: Sem restrição adicional

---

### ✅ **REGISTERED**

| Permissão            | Regra               | Status            |
| -------------------- | ------------------- | ----------------- |
| Criar tabela         | Apenas onde é admin | ✅ OK (Bloqueado) |
| Atualizar tabela     | Apenas onde é admin | ✅ OK             |
| Remover tabela       | Apenas onde é admin | ✅ OK             |
| Visualizar tabela    | Sim                 | ✅ OK             |
| Gerenciar campos     | Apenas onde é admin | ✅ OK             |
| Criar registros      | Sim                 | ✅ OK             |
| Editar registros     | Apenas onde é admin | ✅ OK             |
| Remover registros    | Apenas onde é admin | ✅ OK             |
| Visualizar registros | Sim                 | ✅ OK             |

**Implementação:**

- CREATE_TABLE: Bloqueado completamente (correto, pois não existe tabela ainda)
- UPDATE/REMOVE_TABLE: Valida `isTableAdmin` (não aceita dono)
- Campos: Valida `isTableAdmin` (não aceita dono)
- UPDATE/REMOVE_ROW: Valida `isTableAdmin` (não aceita dono)
- VIEW: Sem restrição adicional

---

## 🎯 **3. REGRAS ESPECIAIS**

### ✅ **Regra 1: Dono/Admin da tabela tem acesso total**

```typescript
const isOwnerOrTableAdmin = isOwner || isTableAdmin;
```

✅ OK - Esta variável é usada em todas as validações críticas.

---

### ✅ **Regra 2: Independente do grupo**

✅ OK - As validações de `isOwnerOrTableAdmin` acontecem ANTES das validações de
grupo.

---

## 🎯 **4. AÇÕES DA TABELA (12 Permissões)**

| Permissão    | Implementação                        | Status |
| ------------ | ------------------------------------ | ------ |
| CREATE_TABLE | ✅ Validada com restrições por grupo | ✅ OK  |
| UPDATE_TABLE | ✅ Validada com ownership e grupo    | ✅ OK  |
| REMOVE_TABLE | ✅ Validada com ownership e grupo    | ✅ OK  |
| VIEW_TABLE   | ✅ Validada com visibilidade         | ✅ OK  |
| CREATE_FIELD | ✅ Validada com ownership e grupo    | ✅ OK  |
| UPDATE_FIELD | ✅ Validada com ownership e grupo    | ✅ OK  |
| REMOVE_FIELD | ✅ Validada com ownership e grupo    | ✅ OK  |
| VIEW_FIELD   | ✅ Validada como visualização        | ✅ OK  |
| CREATE_ROW   | ✅ Validada com visibilidade         | ✅ OK  |
| UPDATE_ROW   | ✅ Validada com ownership e grupo    | ✅ OK  |
| REMOVE_ROW   | ✅ Validada com ownership e grupo    | ✅ OK  |
| VIEW_ROW     | ✅ Validada como visualização        | ✅ OK  |

---

## 🎯 **5. VALIDAÇÕES ADICIONAIS**

| Validação                                         | Status |
| ------------------------------------------------- | ------ |
| ✅ Slug da tabela validado com Zod                | ✅ OK  |
| ✅ Tabela existe no banco                         | ✅ OK  |
| ✅ Cache da tabela no request                     | ✅ OK  |
| ✅ Autenticação do usuário                        | ✅ OK  |
| ✅ Propriedade da tabela (owner)                  | ✅ OK  |
| ✅ Administradores da tabela                      | ✅ OK  |
| ✅ Grupo do usuário                               | ✅ OK  |
| ✅ Permissões no array do usuário                 | ✅ OK  |
| ✅ Validação de grupos permitidos (allowedGroups) | ✅ OK  |
| ✅ Ownership salvo no request                     | ✅ OK  |

---

## 🎯 **6. FLUXO DE EXECUÇÃO**

```
1. ✅ Validar slug da tabela
2. ✅ Buscar tabela no banco
3. ✅ Verificar regras para visitantes (public/form)
4. ✅ Exigir autenticação
5. ✅ Identificar ownership (dono/admin da tabela)
6. ✅ Identificar grupo do usuário
7. ✅ Aplicar matriz de visibilidade
8. ✅ Aplicar regras de grupo
9. ✅ Validar permissão no array de permissões
10. ✅ Validar allowedGroups (se especificado)
```
