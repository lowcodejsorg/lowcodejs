3. Arquitetura
   3.1 Stack de desenvolvimento
   O projeto usa uma arquitetura de monorepo full-stack em TypeScript, com Node.js e Fastify no backend, React no frontend, MongoDB com Mongoose como banco de dados e Redis para cache e fila assíncrona.

   O Fastify substituiu o Express.js pelo desempenho: benchmarks oficiais registram throughput de até 30 mil requisições por segundo, com overhead menor que outros frameworks Node.js [20]. O framework tem suporte nativo a TypeScript, validação de schemas via JSON Schema e sistema de plugins modular. Injeção de dependência e controladores declarativos usam a biblioteca fastify-decorators, com um container centralizado de dependências. A validação de entrada em tempo de execução usa Zod, com inferência de tipos nos contratos.

   No frontend, React é a biblioteca de interface, com SSR via TanStack Start. O roteamento usa TanStack Router com file-based routing: a estrutura de arquivos determina as rotas. A estilização combina Tailwind CSS com design tokens customizados sobre primitivos acessíveis do Radix UI. Estado global do cliente, incluindo sessão de autenticação, fica no Zustand com persistência em localStorage.

   O MongoDB foi escolhido pelo modelo de documentos, que simplifica a criação dinâmica de coleções com campos configuráveis sem um schema relacional fixo [21]. Node.js e React estão entre as tecnologias mais usadas por desenvolvedores, segundo o Stack Overflow Developer Survey [9], o que reduz a curva de aprendizado para novos contribuidores.

   **Figura 1** — Stack de desenvolvimento do lowcode.js, organizada por camada tecnológica.

   3.2 Padrões de Projeto e Código Limpo
   O projeto segue os princípios de código limpo de Martin [22], com ênfase em nomenclatura expressiva, funções com responsabilidade única e sem duplicação de lógica. Convenções de nomenclatura são documentadas: cada artefato segue um padrão de nome que comunica sua responsabilidade diretamente, o que reduz a carga cognitiva sobre novos contribuidores em uma base com mais de 20 recursos REST e 14 entidades de domínio.

   Os padrões de projeto seguem o catálogo de Gamma et al. [23]. O padrão Repository cobre todas as entidades do sistema por uma classe abstrata de contrato e uma implementação concreta com Mongoose; os casos de uso podem ser testados com implementações em memória, sem dependência do banco real. O padrão Factory gera modelos Mongoose em tempo de execução via `buildTable()`, que compila a definição de cada tabela em um modelo ativo. O padrão Singleton gerencia as conexões com MongoDB e Redis. Para tratamento de erros, o projeto usa o Either Pattern: cada operação retorna `Either<HTTPException, T>`, com os pontos de falha explícitos no contrato [25]. Esses padrões estabelecem um vocabulário técnico compartilhado, útil em projetos de contribuição aberta.

   **Figura 3** — Fluxo de uma requisição HTTP ilustrando os padrões Repository, Either e injeção de dependência em ação conjunta.

   3.3 Arquitetura em Camadas
   A organização interna do lowcode.js segue o modelo de arquitetura em camadas, conforme Fowler [24] e Martin [25], com separação de responsabilidades e independência entre componentes.

   São quatro camadas. A Camada de Apresentação contém os componentes React com SSR, o roteamento de páginas e os formulários dinâmicos gerados pelas definições de coleções; é a única que interage diretamente com o navegador. A Camada de Aplicação contém os controladores Fastify: recebem requisições HTTP, delegam a validação ao Zod e chamam os casos de uso, sem lógica de negócio própria. A Camada de Domínio concentra a lógica de negócio pura; cada operação é encapsulada em um caso de uso independente que recebe repositórios e serviços por injeção de dependência, sem referência a objetos HTTP, e pode ser testado em isolamento. A Camada de Infraestrutura encapsula persistência e serviços externos: implementações Mongoose dos repositórios, e-mail via Nodemailer, armazenamento via AWS SDK (filesystem local ou S3 compatível) e filas via BullMQ sobre Redis.

   A Regra da Dependência de Martin [25] se aplica: camadas internas não dependem das externas. O container de injeção de dependências resolve os vínculos entre contrato e implementação na inicialização. As regras de negócio podem ser testadas e evoluídas sem depender da infraestrutura.

   **Figura 2** — Arquitetura em camadas do lowcode.js. Setas sólidas indicam dependência; seta tracejada indica implementação de interface (camadas internas não dependem das externas).

   3.4 Grupos de Campos e Documentos Embutidos
   O lowcode.js permite definir grupos de campos repetíveis: conjuntos estruturados de campos que podem ocorrer várias vezes no mesmo registro, como múltiplos endereços vinculados a um contato ou diferentes formas de financiamento de um projeto. O recurso é configurável pela interface, sem código.

   Grupos de campos são implementados como documentos embutidos no MongoDB, não como coleções separadas vinculadas por referências externas. Cada tabela armazena um campo `_schema` do tipo Mixed no Mongoose, compilado em tempo de execução por `buildTable()` em um modelo ativo que representa os grupos como subdocumentos do registro principal.

   A decisão se apoia em dois estudos. Naydenova et al. [26] mostram que o padrão de consultas planejadas deve orientar a criação de embedded documents, já que essa abordagem reduz o número de leituras necessárias para recuperar um registro completo. Holanda et al. [27] compararam modelos embedded, referenciado e híbrido e verificaram vantagem de desempenho do modelo embedded em leituras quando os dados relacionados são sempre acessados no contexto do documento pai.

   No lowcode.js, grupos de campos são recuperados junto ao registro principal, nunca de forma independente. Armazenar os dados no documento principal elimina joins e garante atomicidade nas escritas, propriedades que importam sob alta concorrência.

   **Figura 4** — Modelo embedded do lowcode.js (1 leitura por registro) comparado ao modelo referenciado (N leituras por coleção relacionada).
