---
id: static-server-functions
title: Server Functions Estáticas
---

> [!WARNING]
> Server Functions Estáticas são experimentais!

## O que são Server Functions Estáticas?

Server functions estáticas são server functions que são executadas em tempo de build e armazenadas em cache como assets estáticos ao usar prerendering/geração estática. Elas podem ser configuradas no modo "static" aplicando o middleware `staticFunctionMiddleware` ao `createServerFn`:

```tsx
import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";

const myServerFn = createServerFn({ method: "GET" })
  .middleware([staticFunctionMiddleware])
  .handler(async () => {
    return "Hello, world!";
  });
```

Certifique-se de que `staticFunctionMiddleware` seja o último middleware!

Esse padrão funciona da seguinte forma:

- Build
  - Durante o prerendering em tempo de build, uma server function com `staticFunctionMiddleware` é executada
  - O resultado é armazenado em cache junto com a saída do build como um arquivo JSON estático sob uma chave derivada (ID da função + hash dos parâmetros/payload)
  - O resultado é retornado normalmente durante o prerendering/geração estática e usado para pré-renderizar a página
- Runtime
  - Inicialmente, o HTML da página pré-renderizada é servido e os dados da server function são incorporados no HTML
  - Quando o cliente é montado, os dados incorporados da server function são hidratados
  - Para futuras invocações no lado do cliente, a server function é substituída por uma chamada fetch ao arquivo JSON estático
