---
id: databases
title: Bancos de Dados
---

Bancos de dados estão no centro de qualquer aplicação dinâmica, fornecendo a infraestrutura necessária para armazenar, recuperar e gerenciar dados. O TanStack Start facilita a integração com uma variedade de bancos de dados, oferecendo uma abordagem flexível para gerenciar a camada de dados da sua aplicação.

## O que devo usar?

O TanStack Start é **projetado para funcionar com qualquer provedor de banco de dados**, então se você já tem um sistema de banco de dados preferido, pode integrá-lo ao TanStack Start usando as APIs full-stack disponíveis. Seja trabalhando com SQL, NoSQL ou outros tipos de bancos de dados, o TanStack Start pode atender às suas necessidades.

## Quão simples é usar um banco de dados com o TanStack Start?

Usar um banco de dados com o TanStack Start é tão simples quanto chamar o adapter/client/driver/serviço do seu banco de dados a partir de uma server function ou rota de servidor do TanStack Start.

Aqui está um exemplo abstrato de como você pode se conectar a um banco de dados e ler/escrever nele:

```tsx
import { createServerFn } from "@tanstack/react-start";

const db = createMyDatabaseClient();

export const getUser = createServerFn().handler(async ({ context }) => {
  const user = await db.getUser(context.userId);
  return user;
});

export const createUser = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    const user = await db.createUser(data);
    return user;
  },
);
```

Isso é obviamente simplificado, mas demonstra que você pode usar literalmente qualquer provedor de banco de dados com o TanStack Start, desde que consiga chamá-lo a partir de uma server function ou rota de servidor.

## Provedores de Banco de Dados Recomendados

Embora o TanStack Start seja projetado para funcionar com qualquer provedor de banco de dados, recomendamos fortemente considerar um dos nossos provedores parceiros avaliados: [Neon](https://neon.tech?utm_source=tanstack) ou [Convex](https://convex.dev?utm_source=tanstack). Eles foram avaliados pelo TanStack para atender aos nossos padrões de qualidade, abertura e desempenho, e ambos são excelentes escolhas para suas necessidades de banco de dados.

## O que é o Neon?

<a href="https://neon.tech?utm_source=tanstack" alt="Neon Logo">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/neon-dark.svg" width="280">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/neon-light.svg" width="280">
    <img alt="Neon logo" src="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/neon-light.svg" width="280">
  </picture>
</a>

O Neon é um PostgreSQL serverless totalmente gerenciado com um plano gratuito generoso. Ele separa armazenamento e computação para oferecer autoscaling, branching e armazenamento ilimitado. Com o Neon, você obtém todo o poder e a confiabilidade do PostgreSQL combinados com capacidades modernas de nuvem, tornando-o perfeito para aplicações TanStack Start.

Principais recursos que fazem o Neon se destacar:

- PostgreSQL serverless que escala automaticamente
- Branching de banco de dados para desenvolvimento e testes
- Connection pooling integrado
- Restauração point-in-time
- Editor SQL baseado na web
- Armazenamento ilimitado
  <br />
  <br />
- Para saber mais sobre o Neon, visite o [site do Neon](https://neon.tech?utm_source=tanstack)
- Para se cadastrar, visite o [painel do Neon](https://console.neon.tech/signup?utm_source=tanstack)

## O que é o Convex?

<a href="https://convex.dev?utm_source=tanstack" alt="Convex Logo">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/convex-white.svg" width="280">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/convex-color.svg" width="280">
    <img alt="Convex logo" src="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/convex-color.svg" width="280">
  </picture>
</a>

O Convex é uma plataforma de banco de dados serverless poderosa que simplifica o processo de gerenciamento dos dados da sua aplicação. Com o Convex, você pode construir aplicações full-stack sem a necessidade de gerenciar manualmente servidores de banco de dados ou escrever queries complexas. O Convex fornece um backend de dados em tempo real, escalável e transacional que se integra perfeitamente ao TanStack Start, tornando-o uma excelente escolha para aplicações web modernas.

O modelo de dados declarativo do Convex e a resolução automática de conflitos garantem que sua aplicação permaneça consistente e responsiva, mesmo em escala. Ele foi projetado para ser amigável ao desenvolvedor, com foco em simplicidade e produtividade.

- Para saber mais sobre o Convex, visite o [site do Convex](https://convex.dev?utm_source=tanstack)
- Para se cadastrar, visite o [painel do Convex](https://dashboard.convex.dev/signup?utm_source=tanstack)

## O que é o Prisma Postgres?

<a href="https://www.prisma.io?utm_source=tanstack&via=tanstack" alt="Prisma Logo">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/prisma-dark.svg" width="280">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/prisma-light.svg" width="280">
    <img alt="Prisma logo" src="https://raw.githubusercontent.com/tanstack/tanstack.com/main/src/images/prisma-light.svg" width="280">
  </picture>
</a>

Postgres Instantâneo, Zero Configuração: Obtenha um banco de dados Postgres pronto para produção em segundos e volte direto para o código. Nós cuidamos de conexões, escalabilidade e ajustes para que seu fluxo nunca seja interrompido. Integra-se perfeitamente com o TanStack Start.

- Otimizado para edge: Roteamento por região local significa menor latência e menos saltos. Até queries complexas são uma única ida e volta rápida.
- Se adapta à sua stack: Funciona com seus frameworks, bibliotecas e ferramentas para uma DX fluida.
- Interface Web: Uma interface hospedada para inspecionar, gerenciar e consultar dados com sua equipe.
- Auto-scaling: Cresce de zero a milhões de usuários sem cold starts ou ajustes manuais.
- Isolamento por unikernel: Cada banco de dados roda como seu próprio unikernel para segurança, velocidade e eficiência.
  <br />
  <br />
- Para saber mais sobre o Prisma Postgres, visite o [site do Prisma](https://www.prisma.io?utm_source=tanstack&via=tanstack)
- Para se cadastrar, visite o [Console do Prisma](https://console.prisma.io/sign-up?utm_source=tanstack&via=tanstack)

## Documentação e APIs

A documentação para integrar diferentes bancos de dados com o TanStack Start está chegando em breve! Enquanto isso, fique de olho nos nossos exemplos e guias para aprender como aproveitar ao máximo sua camada de dados na sua aplicação TanStack Start.
