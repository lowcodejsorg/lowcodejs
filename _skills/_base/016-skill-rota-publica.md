# Skill: Rota Publica (Autenticacao)

A rota publica e o ponto de entrada para paginas nao autenticadas do frontend, como login, registro e recuperacao de senha. Toda rota publica vive sob o layout `/_authentication/`, que renderiza uma pagina limpa sem sidebar nem header. O form de autenticacao utiliza `useForm` diretamente do TanStack Form (nao `useAppForm`), pois sao formularios simples e autocontidos. Apos autenticacao bem-sucedida, o usuario e redirecionado via `router.navigate` com `replace: true`, o store de autenticacao e atualizado com os dados do usuario e feedback visual e fornecido via `toast`. Erros do backend sao tratados via `AxiosError` com mensagens especificas por status code.

---

## Estrutura do Arquivo

```
frontend/
  src/
    routes/
      _authentication/
        route.tsx                              <-- layout de autenticacao (sem sidebar)
        _sign-in/
          index.tsx                            <-- pagina de login
        _sign-up/
          index.tsx                            <-- pagina de registro
        _forgot-password/
          index.tsx                            <-- pagina de recuperacao de senha
    hooks/
      tanstack-query/
        use-authentication-sign-in.ts          <-- mutation de login
        use-authentication-sign-up.ts          <-- mutation de registro
    stores/
      authentication.ts                        <-- store Zustand de autenticacao
```

- As rotas publicas vivem em `frontend/src/routes/_authentication/[action]/index.tsx`.
- O layout pai `/_authentication/` garante que nao haja sidebar nem header.

---

## Template

```typescript
import { useForm } from '@tanstack/react-form';
import { Link, createFileRoute, useRouter } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import * as z from 'zod';
import { useAuthentication{{Action}} } from '@/hooks/tanstack-query/use-authentication-{{action}}';
import { useAuthenticationStore } from '@/stores/authentication';

export const Route = createFileRoute('/_authentication/_{{action}}/')({
  component: RouteComponent,
});

const Form{{Action}}Schema = z.object({
  // campos do formulario com validacao Zod
});

function RouteComponent(): React.JSX.Element {
  const router = useRouter();
  const authentication = useAuthenticationStore();

  const {{action}}Mutation = useAuthentication{{Action}}({
    onSuccess(response) {
      authentication.setAuthenticated({
        name: response.name,
        email: response.email,
        role: response.role,
        sub: response.id,
      });
      router.navigate({ to: '/dashboard', replace: true });
      toast('Operacao realizada com sucesso!', { /* config */ });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        // Tratar erros por status code (401, 400, 500)
      }
    },
  });

  const form = useForm({
    defaultValues: { /* campos com valores iniciais */ },
    validators: { onSubmit: Form{{Action}}Schema },
    onSubmit: async function ({ value: payload }) {
      await {{action}}Mutation.mutateAsync(payload);
    },
  });

  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
        {/* form.Field para cada campo */}
        <Button type="submit" disabled={{{action}}Mutation.status === 'pending'}>
          {{{action}}Mutation.status === 'pending' && <Spinner />}
          Enviar
        </Button>
      </form>
    </div>
  );
}
```

---

## Exemplo Real

```typescript
import { useForm } from '@tanstack/react-form';
import { Link, createFileRoute, useRouter } from '@tanstack/react-router';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import * as z from 'zod';
import { useAuthenticationSignIn } from '@/hooks/tanstack-query/use-authentication-sign-in';
import { useAuthenticationStore } from '@/stores/authentication';

export const Route = createFileRoute('/_authentication/_sign-in/')({
  component: RouteComponent,
});

const FormSignInSchema = z.object({
  email: z.email('Digite um email valido'),
  password: z.string({ message: 'A senha e obrigatoria' }).min(1, 'A senha e obrigatoria'),
});

function RouteComponent(): React.JSX.Element {
  const router = useRouter();
  const authentication = useAuthenticationStore();

  const signInMutation = useAuthenticationSignIn({
    onSuccess(response) {
      authentication.setAuthenticated({
        name: response.name,
        email: response.email,
        role: response.role,
        sub: response.id,
      });
      router.navigate({ to: ROLE_DEFAULT_ROUTE[role], replace: true });
      toast('Login realizado com sucesso!', {
        description: `Bem-vindo, ${response.name}`,
      });
    },
    onError(error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        const cause = error.response?.data?.cause;

        if (status === 401) {
          toast('Credenciais invalidas', { description: cause });
        } else if (status === 400) {
          toast('Dados invalidos', { description: cause });
        } else {
          toast('Erro interno', { description: 'Tente novamente mais tarde' });
        }
      }
    },
  });

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: FormSignInSchema },
    onSubmit: async function ({ value: payload }) {
      await signInMutation.mutateAsync(payload);
    },
  });

  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
        <form.Field name="email">
          {(field) => (
            <div>
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors?.length > 0 && (
                <span className="text-destructive text-sm">{field.state.meta.errors[0]}</span>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <div>
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors?.length > 0 && (
                <span className="text-destructive text-sm">{field.state.meta.errors[0]}</span>
              )}
            </div>
          )}
        </form.Field>

        <Button type="submit" disabled={signInMutation.status === 'pending'}>
          {signInMutation.status === 'pending' && <Spinner />}
          Entrar
        </Button>

        <Link to="/sign-up">Criar conta</Link>
      </form>
    </div>
  );
}
```

**Leitura do exemplo:**

1. `createFileRoute('/_authentication/_sign-in/')` registra a rota sob o layout de autenticacao. O prefixo `/_authentication/` garante que nao haja sidebar nem header.
2. `FormSignInSchema` define a validacao Zod inline no proprio arquivo (nao importada de `@/lib/schemas`), pois e um form simples e autocontido.
3. `useAuthenticationSignIn` e o hook de mutation que faz a chamada POST para a API de login. Recebe callbacks `onSuccess` e `onError`.
4. No `onSuccess`, o store de autenticacao e atualizado com `setAuthenticated`, o usuario e redirecionado via `router.navigate` com `replace: true` (para nao poder voltar ao login com o botao back) e um `toast` fornece feedback visual.
5. No `onError`, o erro e verificado como `AxiosError` e tratado por status code. O campo `cause` do response body e usado como mensagem descritiva.
6. `useForm` (nao `useAppForm`) cria o form com `defaultValues`, `validators: { onSubmit: Schema }` (validacao apenas no submit, nao no change) e `onSubmit` que chama a mutation.
7. `form.Field` (nao `form.AppField`) e usado para binding de campos. O callback recebe `field` com `state.value`, `handleChange` e `state.meta.errors` para exibicao de erros.
8. O botao de submit e desabilitado durante o loading (`signInMutation.status === 'pending'`) e exibe um Spinner.
9. O `Link` para sign-up permite navegacao entre paginas de autenticacao sem recarregar.

---

## Regras e Convencoes

1. **Sempre sob `/_authentication/`** -- toda rota publica (login, registro, recuperacao de senha) deve estar dentro da pasta `routes/_authentication/`. Isso garante o layout limpo sem sidebar.

2. **`useForm` direto (nao `useAppForm`)** -- formularios de autenticacao sao simples e autocontidos. Nao utilizam `useAppForm` nem `withForm` do setup customizado. O `useForm` puro do TanStack Form e suficiente.

3. **`form.Field` (nao `form.AppField`)** -- como `useForm` e usado no lugar de `useAppForm`, os campos sao declarados via `form.Field` com binding manual (`field.state.value`, `field.handleChange`).

4. **Schema Zod inline** -- o schema de validacao e definido no proprio arquivo da rota, nao importado de `@/lib/schemas`. Formularios de auth sao autocontidos.

5. **`validators: { onSubmit: Schema }`** -- a validacao em rotas publicas e feita no submit (nao no `onChange`), diferente dos formularios de CRUD que usam `onChange`.

6. **Redirect pos-login com `replace: true`** -- apos autenticacao bem-sucedida, use `router.navigate({ to: '/path', replace: true })`. O `replace` impede que o usuario volte a tela de login com o botao back do navegador.

7. **`setAuthenticated` no store** -- apos login, o store de autenticacao deve ser atualizado com `name`, `email`, `role` e `sub` do response. Isso e necessario para que o layout privado e as rotas filhas tenham acesso aos dados do usuario.

8. **`toast` para feedback** -- use `toast` do `sonner` para notificar sucesso e erro. Nunca use `alert()` ou `console.log()` para feedback ao usuario.

9. **Tratamento de `AxiosError` por status code** -- erros do backend sao tratados no `onError` da mutation. Verifique `error instanceof AxiosError`, extraia `status` e `data.cause` e exiba mensagens especificas.

10. **`setFieldMeta` para erros do servidor** -- quando o backend retorna erros de validacao especificos por campo (ex.: "email ja cadastrado"), use `form.setFieldMeta` para exibir o erro no campo correto, em vez de apenas um toast generico.

11. **Spinner no botao durante loading** -- o botao de submit deve exibir um `Spinner` e ficar `disabled` enquanto a mutation esta em `pending`. Isso evita submissoes duplicadas e fornece feedback visual.

---

## Checklist

- [ ] O arquivo esta em `routes/_authentication/[action]/index.tsx`.
- [ ] `createFileRoute` usa o path completo com `/_authentication/` e barra final.
- [ ] A rota e exportada como `export const Route`.
- [ ] O schema Zod e definido inline no arquivo.
- [ ] `useForm` (nao `useAppForm`) e usado para o formulario.
- [ ] `validators` usa `onSubmit` (nao `onChange`).
- [ ] A mutation tem callbacks `onSuccess` e `onError`.
- [ ] `onSuccess` atualiza o store com `setAuthenticated`.
- [ ] `onSuccess` redireciona com `router.navigate({ to, replace: true })`.
- [ ] `onSuccess` exibe `toast` de sucesso.
- [ ] `onError` verifica `error instanceof AxiosError` e trata por status code.
- [ ] O botao de submit e `disabled` durante loading e exibe `Spinner`.
- [ ] O `<form>` usa `e.preventDefault()` + `form.handleSubmit()` no `onSubmit`.
- [ ] Links entre paginas de auth usam `<Link>` do TanStack Router.

---

## Erros Comuns

| Erro | Causa | Correcao |
|------|-------|----------|
| Usuario volta ao login apos autenticar com botao back | `navigate` sem `replace: true` | Adicionar `replace: true` no `router.navigate` |
| Sidebar aparece na tela de login | Rota fora da pasta `/_authentication/` | Mover o arquivo para `routes/_authentication/[action]/index.tsx` |
| Form nao valida no submit | Schema Zod nao passado no `validators` | Adicionar `validators: { onSubmit: Schema }` no `useForm` |
| Erro do backend nao exibido | `onError` nao trata `AxiosError` | Verificar `error instanceof AxiosError` e extrair `response.data.cause` |
| Toast de sucesso aparece antes do redirect | `toast` chamado antes de `router.navigate` | Chamar `router.navigate` antes do `toast`, ou aceitar que a ordem nao afeta o UX |
| Uso de `useAppForm` em form de auth | Confusao com o hook customizado do CRUD | Usar `useForm` do `@tanstack/react-form` para formularios de autenticacao |
| Store nao atualizado apos login | `setAuthenticated` nao chamado no `onSuccess` | Garantir que `authentication.setAuthenticated({...})` e chamado com todos os campos |
| Erros de validacao do servidor nao aparecem no campo | Uso apenas de `toast` para erros de campo | Usar `form.setFieldMeta` para vincular erros do servidor a campos especificos |
| Spinner nao aparece durante loading | Verificacao de status incorreta | Usar `mutation.status === 'pending'` (nao `mutation.isLoading`) |
| Login funciona mas cookies nao sao enviados | `API` nao configurada com `withCredentials: true` | Verificar a configuracao do HTTP client (ver `025-skill-http-client.md`) |

---

**Cross-references:** ver [023-skill-store.md](./023-skill-store.md), [018-skill-hook-mutation.md](./018-skill-hook-mutation.md).
