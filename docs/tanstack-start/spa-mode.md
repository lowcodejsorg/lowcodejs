---
id: spa-mode
title: Modo SPA
---

## O que é o modo SPA?

Para aplicações que não necessitam de SSR por motivos de SEO, crawlers ou performance, pode ser desejável entregar HTML estático aos seus usuários contendo o "shell" da sua aplicação (ou até HTML pré-renderizado para rotas específicas) que contenha as tags `html`, `head` e `body` necessárias para inicializar sua aplicação apenas no cliente.

## Por que usar o Start sem SSR?

**Sem SSR não significa abrir mão de funcionalidades do lado do servidor!** Os modos SPA na verdade combinam muito bem com funcionalidades server-side como server functions e/ou server routes ou até outras APIs externas. Isso **simplesmente significa que o documento inicial não conterá o HTML totalmente renderizado da sua aplicação até que ele tenha sido renderizado no cliente usando JavaScript**.

## Benefícios do modo SPA

- **Mais fácil de fazer deploy** - Um CDN que possa servir assets estáticos é tudo o que você precisa.
- **Mais barato** para hospedar - CDNs são baratos comparados a funções Lambda ou processos de longa duração.
- **Apenas client-side é mais simples** - Sem SSR significa menos problemas com hidratação, renderização e roteamento.

## Ressalvas do modo SPA

- **Tempo maior até o conteúdo completo** - O tempo até o conteúdo completo é maior, já que todo o JS precisa ser baixado e executado antes que qualquer coisa abaixo do shell possa ser renderizada.
- **Menos amigável para SEO** - Robôs, crawlers e ferramentas de unfurl de links _podem_ ter mais dificuldade para indexar sua aplicação, a menos que estejam configurados para executar JS e sua aplicação consiga renderizar em um tempo razoável.

## Como funciona?

Após habilitar o modo SPA, executar um build do Start terá uma etapa adicional de prerendering em seguida para gerar o shell. Isso é feito por:

- **Prerendering** apenas da **rota raiz** da sua aplicação
- Onde sua aplicação normalmente renderizaria suas rotas correspondentes, o **componente de fallback pendente configurado no seu router é renderizado em seu lugar**.
- O HTML resultante é armazenado em uma página HTML estática chamada `/_shell.html` (configurável)
- Redirecionamentos padrão são configurados para redirecionar todas as requisições 404 para o shell do modo SPA

> [!NOTE]
> Outras rotas também podem ser pré-renderizadas e é recomendado pré-renderizar o máximo possível no modo SPA, mas isso não é obrigatório para o modo SPA funcionar.

## Configurando o modo SPA

Para configurar o modo SPA, existem algumas opções que você pode adicionar às opções do seu plugin do Start:

```tsx
// vite.config.ts
export default defineConfig({
  plugins: [
    tanstackStart({
      spa: {
        enabled: true,
      },
    }),
  ],
});
```

## Use os Redirecionamentos Necessários

Fazer deploy de uma SPA puramente client-side em um host ou CDN frequentemente requer o uso de redirecionamentos para garantir que as URLs sejam corretamente reescritas para o shell da SPA. O objetivo de qualquer deploy deve incluir estas prioridades nesta ordem:

1. Garantir que assets estáticos sempre serão servidos se existirem, ex: /about.html. Este é geralmente o comportamento padrão da maioria dos CDNs
2. (Opcional) Permitir subpaths específicos para serem roteados através de handlers dinâmicos do servidor, ex: /api/\*\* (Mais sobre isso abaixo)
3. Garantir que todas as requisições 404 sejam reescritas para o shell da SPA, ex: um redirecionamento catch-all para /\_shell.html (ou se você configurou o caminho de saída do seu shell para algo personalizado, use esse em vez disso)

## Exemplo Básico de Redirecionamentos

Vamos usar o arquivo `_redirects` do Netlify para reescrever todas as requisições 404 para o shell da SPA.

```
# Captura todas as outras requisições 404 e reescreve para o shell da SPA
/* /_shell.html 200
```

## Permitindo Server Functions e Server Routes

Novamente, usando o arquivo `_redirects` do Netlify, podemos permitir subpaths específicos para serem roteados através do servidor.

```
# Permite que requisições para /_serverFn/* sejam roteadas através do servidor (Se você configurou o caminho base das suas server functions para algo diferente de /_serverFn, use esse em vez disso)
/_serverFn/* /_serverFn/:splat 200

# Permite que quaisquer requisições para /api/* sejam roteadas através do servidor (Server routes podem ser criadas em qualquer caminho, então você deve garantir que quaisquer server routes que você queira usar estejam sob este caminho, ou simplesmente adicione redirecionamentos adicionais para cada base de server route que você queira expor)
/api/* /api/:splat 200

# Captura todas as outras requisições 404 e reescreve para o shell da SPA
/* /_shell.html 200
```

## Caminho de Máscara do Shell

O pathname padrão usado para gerar o shell da SPA é `/`. Chamamos isso de **caminho de máscara do shell** (shell mask path). Como as rotas correspondentes não são incluídas, o pathname usado para gerar o shell é praticamente irrelevante, mas ainda é configurável.

> [!NOTE]
> É recomendado manter o valor padrão de `/` como o caminho de máscara do shell.

```tsx
// vite.config.ts
export default defineConfig({
  plugins: [
    tanstackStart({
      spa: {
        maskPath: "/app",
      },
    }),
  ],
});
```

## Opções de Prerendering

A opção de prerender é usada para configurar o comportamento de prerendering do shell da SPA, e aceita as mesmas opções de prerender encontradas no nosso guia de prerendering.

**Por padrão, as seguintes opções de `prerender` são definidas:**

- `outputPath`: `/_shell.html`
- `crawlLinks`: `false`
- `retryCount`: `0`

Isso significa que, por padrão, o shell não será rastreado em busca de links para seguir para prerendering adicional, e não tentará novamente em caso de falhas no prerendering.

Você sempre pode sobrescrever essas opções fornecendo suas próprias opções de prerender:

```tsx
// vite.config.ts
export default defineConfig({
  plugins: [
    tanstackStart({
      spa: {
        prerender: {
          outputPath: "/custom-shell",
          crawlLinks: true,
          retryCount: 3,
        },
      },
    }),
  ],
});
```

## Renderização personalizada no modo SPA

Personalizar a saída HTML do shell da SPA pode ser útil se você quiser:

- Fornecer tags head genéricas para rotas SPA
- Fornecer um componente de fallback pendente personalizado
- Alterar literalmente qualquer coisa sobre o HTML, CSS e JS do shell

Para simplificar esse processo, uma função `isShell()` pode ser encontrada na instância do `router`:

```tsx
// src/routes/root.tsx
export default function Root() {
  const isShell = useRouter().isShell();

  if (isShell) console.log("Renderizando o shell!");
}
```

Você pode usar esse booleano para renderizar condicionalmente diferentes UIs com base em se a rota atual é um shell ou não, mas tenha em mente que após hidratar o shell, o router navegará imediatamente para a primeira rota e `isShell()` retornará `false`. **Isso pode produzir flashes de conteúdo sem estilo se não for tratado adequadamente.**

## Dados Dinâmicos no seu Shell

Como o shell é pré-renderizado usando o build SSR da sua aplicação, quaisquer `loader`s ou funcionalidades específicas do servidor definidas na sua **Rota Raiz** serão executadas durante o processo de prerendering e os dados serão incluídos no shell.

Isso significa que você pode usar dados dinâmicos no seu shell utilizando um `loader` ou funcionalidades específicas do servidor.

```tsx
// src/routes/__root.tsx

export const RootRoute = createRootRoute({
  loader: async () => {
    return {
      name: "Tanner",
    };
  },
  component: Root,
});

export default function Root() {
  const { name } = useLoaderData();

  return (
    <html>
      <body>
        <h1>Hello, {name}!</h1>
        <Outlet />
      </body>
    </html>
  );
}
```
