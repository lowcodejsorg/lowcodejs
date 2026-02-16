# 020 - Rotas de Autenticacao

Documentacao das rotas de autenticacao do LowCodeJS: sign-in (login) e sign-up (cadastro). Localizadas em `src/routes/_authentication/`.

---

## Visao Geral

| Rota | Arquivo | Componente | Descricao |
|------|---------|-----------|-----------|
| `/` (raiz) | `src/routes/_authentication/_sign-in/index.tsx` | `RouteComponent` | Formulario de login |
| `/sign-up` | `src/routes/_authentication/sign-up/index.tsx` | `RouteComponent` | Formulario de cadastro |

Ambas as rotas estao dentro do layout `_authentication`, que e um layout sem autenticacao (publico).

---

## Tecnologias Utilizadas

| Tecnologia | Uso |
|-----------|-----|
| `@tanstack/react-form` | Gerenciamento de formularios |
| `@tanstack/react-router` | Roteamento e navegacao |
| `zod` | Validacao de schema |
| `axios` / `AxiosError` | Requisicoes HTTP e tratamento de erros |
| `sonner` | Notificacoes toast |
| `Zustand` | Store de autenticacao |

---

## Sign-In (Login)

**Arquivo:** `src/routes/_authentication/_sign-in/index.tsx`

### Rota

```tsx
export const Route = createFileRoute('/_authentication/_sign-in/')({
  component: RouteComponent,
});
```

### Schema de Validacao

```tsx
const FormSignInSchema = z.object({
  email: z.email('Digite um email valido'),
  password: z
    .string({ message: 'A senha e obrigatoria' })
    .min(1, 'A senha e obrigatoria'),
});
```

| Campo | Tipo | Validacao |
|-------|------|-----------|
| `email` | `string` | Formato de email valido |
| `password` | `string` | Obrigatorio, minimo 1 caractere |

### Formulario

```tsx
const form = useForm({
  defaultValues: {
    email: '',
    password: '',
  },
  validators: {
    onSubmit: FormSignInSchema,
  },
  onSubmit: async function ({ value: payload }) {
    await signInMutation.mutateAsync(payload);
  },
});
```

### Campos do Formulario

**Campo de E-mail:**
- Input com icone `MailIcon`
- Placeholder: "exemplo@mail.com"
- Valor trimmed automaticamente (`value.trim()`)
- Exibe `FieldError` quando invalido

**Campo de Senha:**
- Input com icone `LockIcon`
- Toggle de visibilidade (icone `EyeIcon`/`EyeClosedIcon`)
- Placeholder: "........"
- Exibe `FieldError` quando invalido

**Botao de Submit:**
- Texto: "Entrar"
- Desabilitado durante `signInMutation.status === 'pending'`
- Exibe `Spinner` durante o processamento

### Fluxo de Login

```
1. Usuario preenche email e senha
2. Clica em "Entrar" -> form.handleSubmit()
3. Validacao Zod (onSubmit) e executada
4. Se valido: signInMutation.mutateAsync(payload)
5. API POST de sign-in e chamada
6. Em caso de SUCESSO:
   a. Extrai role do response: response.group.slug.toUpperCase()
   b. Salva no store Zustand:
      authentication.setAuthenticated({
        name: response.name,
        email: response.email,
        role: role,
        sub: response._id.toString()
      })
   c. Determina rota padrao por role: ROLE_DEFAULT_ROUTE[role]
   d. Navega para a rota: router.navigate({ to: route, replace: true })
   e. Exibe toast de sucesso: "Login realizado com sucesso!"
7. Em caso de ERRO:
   a. 401 INVALID_CREDENTIALS -> Exibe erro no campo password
   b. 400 INVALID_PAYLOAD_FORMAT -> Exibe erros nos campos email/password
   c. 500 SIGN_IN_ERROR -> Toast de erro generico
```

### Tratamento de Erros

```tsx
function setFieldError(
  field: keyof z.infer<typeof FormSignInSchema>,
  message: string,
): void {
  form.setFieldMeta(field, (prev) => ({
    ...prev,
    isTouched: true,
    errors: [{ message }],
    errorMap: { onSubmit: { message } },
  }));
}
```

| Codigo HTTP | Causa | Comportamento |
|------------|-------|---------------|
| 401 | `INVALID_CREDENTIALS` | Erro no campo password com a mensagem do servidor |
| 400 | `INVALID_PAYLOAD_FORMAT` | Erros individuais nos campos email e/ou password |
| 500 | `SIGN_IN_ERROR` | Toast de erro: "Houve um erro ao fazer login" |
| Outros | - | Toast generico: "Houve um erro interno ao fazer login" |

### Link para Cadastro

```tsx
<FieldDescription>
  Nao possui uma conta?{' '}
  <Link to="/sign-up" className="underline underline-offset-2">
    Clique aqui
  </Link>
</FieldDescription>
```

### Exemplo Completo

```tsx
// Estrutura do formulario de login
<form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
  <FieldGroup>
    {/* Logo */}
    <Logo />

    {/* Campo de email */}
    <form.Field name="email">
      {(field) => (
        <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
          <FieldLabel>E-mail</FieldLabel>
          <InputGroup>
            <InputGroupInput
              placeholder="exemplo@mail.com"
              value={field.state.value.trim()}
              onChange={(e) => field.handleChange(e.target.value.trim())}
            />
            <InputGroupAddon><MailIcon /></InputGroupAddon>
          </InputGroup>
          <FieldError errors={field.state.meta.errors} />
        </Field>
      )}
    </form.Field>

    {/* Campo de senha */}
    <form.Field name="password">
      {(field) => (
        <Field>
          <FieldLabel>Senha</FieldLabel>
          <InputGroup>
            <InputGroupInput
              type={showPassword ? 'text' : 'password'}
              placeholder="........"
            />
            <InputGroupAddon><LockIcon /></InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <InputGroupButton onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeClosedIcon /> : <EyeIcon />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      )}
    </form.Field>

    {/* Botao de submit */}
    <Button type="submit" disabled={signInMutation.status === 'pending'}>
      {signInMutation.status === 'pending' && <Spinner />}
      <span>Entrar</span>
    </Button>
  </FieldGroup>
</form>
```

---

## Sign-Up (Cadastro)

**Arquivo:** `src/routes/_authentication/sign-up/index.tsx`

### Rota

```tsx
export const Route = createFileRoute('/_authentication/sign-up/')({
  component: RouteComponent,
});
```

### Schema de Validacao

```tsx
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/;

const FormSignUpSchema = z
  .object({
    name: z
      .string({ message: 'O nome e obrigatorio' })
      .min(1, 'O nome e obrigatorio'),
    email: z
      .string({ message: 'O email e obrigatorio' })
      .email('Digite um email valido'),
    password: z
      .string({ message: 'A senha e obrigatoria' })
      .min(6, 'A senha deve ter no minimo 6 caracteres')
      .regex(passwordRegex,
        'A senha deve conter: 1 maiuscula, 1 minuscula, 1 numero e 1 especial'),
    confirmPassword: z
      .string({ message: 'A confirmacao de senha e obrigatoria' })
      .min(1, 'A confirmacao de senha e obrigatoria'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas nao coincidem',
    path: ['confirmPassword'],
  });
```

| Campo | Tipo | Validacao |
|-------|------|-----------|
| `name` | `string` | Obrigatorio, minimo 1 caractere |
| `email` | `string` | Obrigatorio, formato de email valido |
| `password` | `string` | Minimo 6 caracteres + regex de complexidade |
| `confirmPassword` | `string` | Obrigatorio, deve coincidir com `password` |

### PASSWORD_REGEX

A senha deve conter obrigatoriamente:

| Requisito | Regex | Descricao |
|-----------|-------|-----------|
| Minuscula | `(?=.*[a-z])` | Pelo menos 1 letra minuscula |
| Maiuscula | `(?=.*[A-Z])` | Pelo menos 1 letra maiuscula |
| Numero | `(?=.*\d)` | Pelo menos 1 digito |
| Especial | `(?=.*[!@#$%^&*(),.?":{}|<>])` | Pelo menos 1 caractere especial |

Alem disso, o schema exige `min(6)` caracteres no total.

### Formulario

```tsx
const form = useForm({
  defaultValues: {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
  validators: {
    onSubmit: FormSignUpSchema,
  },
  onSubmit: async function ({ value: payload }) {
    const { confirmPassword, ...data } = payload;
    await signUpMutation.mutateAsync(data);
  },
});
```

Nota: O campo `confirmPassword` e removido do payload antes de enviar para a API.

### Campos do Formulario

| Campo | Icone | Placeholder | Toggle |
|-------|-------|-------------|--------|
| Nome | `UserIcon` | "Seu nome completo" | - |
| E-mail | `MailIcon` | "exemplo@mail.com" | - |
| Senha | `LockIcon` | "........" | Sim (EyeIcon) |
| Confirmar Senha | `LockIcon` | "........" | Sim (EyeIcon) |

Cada campo de senha possui seu proprio toggle de visibilidade independente (`showPassword` e `showConfirmPassword`).

### Fluxo de Cadastro

```
1. Usuario preenche nome, email, senha e confirmacao
2. Clica em "Criar conta" -> form.handleSubmit()
3. Validacao Zod (onSubmit):
   a. Valida cada campo individualmente
   b. Verifica se password === confirmPassword (.refine)
4. Se valido: signUpMutation.mutateAsync({ name, email, password })
   (confirmPassword e removido do payload)
5. API POST de sign-up e chamada
6. Em caso de SUCESSO:
   a. Navega para "/" (pagina de login): router.navigate({ to: '/', replace: true })
7. Em caso de ERRO:
   a. 400 INVALID_PAYLOAD_FORMAT -> Erros nos campos name/email/password
   b. 409 USER_ALREADY_EXISTS -> Erro no campo email: "Este email ja esta em uso"
   c. 500 SIGN_UP_ERROR -> Toast de erro
   d. Outros -> Toast generico
```

### Tratamento de Erros

| Codigo HTTP | Causa | Comportamento |
|------------|-------|---------------|
| 400 | `INVALID_PAYLOAD_FORMAT` | Erros individuais nos campos name, email, password |
| 409 | `USER_ALREADY_EXISTS` | Erro no campo email: "Este email ja esta em uso" |
| 500 | `SIGN_UP_ERROR` | Toast: "Houve um erro ao fazer cadastro" |
| Outros | - | Toast generico: "Houve um erro interno" |

### Link para Login

```tsx
<FieldDescription>
  Ja possui uma conta?{' '}
  <Link to="/" className="underline underline-offset-2">
    Faca login
  </Link>
</FieldDescription>
```

---

## Store de Autenticacao (Zustand)

O `useAuthenticationStore` e um store Zustand que gerencia o estado de autenticacao:

```tsx
interface Authenticated {
  name: string;
  email: string;
  role: string;   // Ex: 'ADMIN', 'USER', 'PROFESSOR'
  sub: string;    // ID do usuario
}

// Metodos do store:
authentication.setAuthenticated(data: Authenticated)  // Define usuario autenticado
authentication.logout()                                // Remove autenticacao
authentication.authenticated                           // Dados do usuario (ou null)
```

### Redirecionamento por Role

Apos login bem-sucedido, o usuario e redirecionado para a rota padrao do seu grupo:

```tsx
const role = response.group.slug.toUpperCase() as Authenticated['role'];
const route = ROLE_DEFAULT_ROUTE[role];
router.navigate({ to: route, replace: true });
```

O mapeamento `ROLE_DEFAULT_ROUTE` e definido em `src/lib/menu/menu-access-permissions.ts`.

---

## Hooks de Autenticacao

| Hook | Arquivo | Descricao |
|------|---------|-----------|
| `useAuthenticationSignIn` | `use-authentication-sign-in.ts` | Mutation para login |
| `useAuthenticationSignUp` | `use-authentication-sign-up.ts` | Mutation para cadastro |
| `useAuthenticationSignOut` | `use-authentication-sign-out.ts` | Mutation para logout |

Todos utilizam TanStack Query (`useMutation`) e aceitam callbacks `onSuccess` e `onError`.

---

## Componentes de UI Utilizados

Os formularios de autenticacao utilizam os seguintes componentes de UI:

| Componente | Import | Descricao |
|-----------|--------|-----------|
| `Logo` | `@/components/common/logo` | Logotipo SVG no topo |
| `Button` | `@/components/ui/button` | Botao de submit |
| `Field`, `FieldLabel`, `FieldError`, `FieldGroup`, `FieldDescription` | `@/components/ui/field` | Estrutura de campos |
| `InputGroup`, `InputGroupInput`, `InputGroupAddon`, `InputGroupButton` | `@/components/ui/input-group` | Inputs com addons |
| `Spinner` | `@/components/ui/spinner` | Indicador de carregamento |

---

## Layout Visual

Ambos os formularios seguem o mesmo layout:

```
+----------------------------------+
|          (centralizado)          |
|                                  |
|           [Logo SVG]             |
|                                  |
|     Link para sign-up/login      |
|                                  |
|     [Campo Email/Nome]           |
|     [Campo Senha]                |
|     [Campo Confirmar Senha]*     |
|                                  |
|     [======= Botao =======]     |
|                                  |
+----------------------------------+

* Apenas no sign-up
```

Classes CSS do container: `flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10`
Largura maxima do formulario: `max-w-sm`
