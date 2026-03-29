# Chat

Componentes de chat em tempo real com assistente IA, usando WebSocket para
comunicacao.

## Arquivos

| Arquivo            | Descricao                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`         | Barrel export de todos os componentes                                                                                                                               |
| `chat-panel.tsx`   | Painel principal do chat: lista de mensagens, input de texto, upload de arquivos (imagem/PDF), indicadores de status (thinking, tool_call, tool_result, tool_error) |
| `chat-message.tsx` | Renderiza uma mensagem individual (user ou assistant). Usa ReactMarkdown + remarkGfm para conteudo formatado                                                        |
| `chat-sidebar.tsx` | Container responsivo: Sheet no mobile, painel lateral fixo (340px) no desktop                                                                                       |
| `chat-trigger.tsx` | Botao para abrir/fechar o chat com icone MessageCircle                                                                                                              |

## Dependencias principais

- `@/hooks/use-chat-socket` (useChatSocket) para conexao WebSocket, mensagens e
  tool activities
- `react-markdown` + `remark-gfm` para renderizacao de markdown nas respostas
- `@/hooks/use-mobile` (useIsMobile) para layout responsivo
- `@tanstack/react-router` (getRouteApi) para obter baseUrl do loader root

## Padroes importantes

- Upload de arquivos via POST para `${baseUrl}/chat/upload` com FormData
- Enter envia mensagem, Shift+Enter quebra linha
- Tool activities exibem status de ferramentas do agente (loading, resultado,
  erro)
- Mensagens do usuario tem fundo `bg-primary`, do assistente `bg-muted`
- UI em PT-BR (labels: Assistente IA, Pensando, Limpar historico)
