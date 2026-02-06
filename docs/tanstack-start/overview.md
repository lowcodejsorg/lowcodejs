---
id: overview
title: Visão Geral do TanStack Start
---

> [!NOTE]
> O TanStack Start está atualmente na fase de **Release Candidate**! Isso significa que é considerado funcionalidade completa e sua API é considerada estável.
> **Isso não significa que está livre de bugs ou problemas, por isso convidamos você a experimentá-lo e enviar seu feedback!**
> O caminho até a v1 provavelmente será rápido, então não espere muito para experimentar!

TanStack Start é um framework React full-stack alimentado pelo TanStack Router. Ele fornece SSR de documento completo, streaming, server functions, bundling e muito mais. Graças ao [Vite](https://vite.dev/), ele está pronto para desenvolver e fazer deploy em qualquer provedor de hospedagem ou runtime que você quiser!

## Dependências

O TanStack Start é construído sobre duas tecnologias principais:

- **[TanStack Router](https://tanstack.com/router)**: Um roteador type-safe para construção de aplicações web com recursos avançados como rotas aninhadas, parâmetros de busca e carregamento de dados
- **[Vite](https://vite.dev/)**: Uma ferramenta de build moderna que oferece desenvolvimento rápido com hot module replacement e builds de produção otimizadas

## Devo usar o TanStack Start ou apenas o TanStack Router?

90% de qualquer framework geralmente se resume ao roteador, e o TanStack Start não é diferente. **O TanStack Start depende 100% do TanStack Router para seu sistema de rotas.** Além dos recursos incríveis do TanStack Router, o Start habilita recursos ainda mais poderosos:

- **SSR de documento completo** - Renderização no servidor para melhor performance e SEO
- **Streaming** - Carregamento progressivo de páginas para uma melhor experiência do usuário
- **Server Routes e API Routes** - Construa endpoints backend junto com seu frontend
- **Server Functions** - RPCs type-safe entre client e server
- **Middleware e Context** - Tratamento poderoso de requisição/resposta e injeção de dados
- **Bundling Full-Stack** - Builds otimizadas para código do client e do server
- **Deploy Universal** - Faça deploy em qualquer provedor de hospedagem compatível com Vite
- **Type Safety de Ponta a Ponta** - Suporte completo a TypeScript em toda a stack

Dito isso, se você **tem certeza absoluta** de que não precisará de nenhum dos recursos acima, então pode considerar usar o TanStack Router sozinho, que ainda é uma atualização poderosa e type-safe de roteamento SPA em relação a outros roteadores e frameworks.

## Existem limitações?

A única limitação relevante é que o TanStack Start atualmente não suporta React Server Components, **mas estamos trabalhando ativamente na integração e esperamos suportá-los em um futuro próximo.**

Fora isso, o TanStack Start oferece a mesma capacidade de outros frameworks full-stack como Next.js, Remix, etc., com ainda mais recursos e uma experiência de desenvolvedor mais poderosa.

## Como o TanStack Start é financiado?

O TanStack é 100% open source, gratuito para uso e sempre será. Ele é construído e mantido por uma comunidade extremamente talentosa e dedicada de desenvolvedores e engenheiros de software. O TanStack.com (também open source) é de propriedade da TanStack LLC, uma empresa privada, 100% bootstrapped e autofinanciada. Não somos financiados por venture capital e nunca buscamos investidores. Para apoiar o desenvolvimento do TanStack Start e outras bibliotecas TanStack, o TanStack.com faz parceria com [essas empresas incríveis](https://tanstack.com/partners?status=active&libraries=%5B%22start%22%5D) que oferecem tanto suporte financeiro quanto recursos para nos ajudar a continuar construindo a melhor experiência possível para desenvolvedores na comunidade web:

<iframe src="https://tanstack.com/partners-embed" style="aspect-ratio: 1/2; width: 100%;"></iframe>

## Pronto para começar?

Vá para a próxima página para aprender como instalar o TanStack Start e criar seu primeiro app!
