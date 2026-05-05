## Reverter "Links rápidos por aba" para layout compacto

Voltar a seção `Quick Tab Links` (em `src/pages/admin/AdminWhatsApp.tsx`, linhas ~322-503) para o formato anterior — apenas o nome de cada aba, sem o card grande estilo preview do WhatsApp, sem campo `utm_content` exposto e sem a URL longa visível.

### Como ficará cada item

Um chip/linha compacta por aba (Ao Vivo, Novidades, Sugestões, Programação) com:
- Ícone + emoji + nome da aba (ex.: `🔴 Ao Vivo`)
- Dois botões pequenos: `Copiar` e `Status` (WhatsApp)

Sem mostrar a URL completa, sem mostrar host, sem campo de utm_content, sem sugestões de chips.

```text
┌─────────────────────────────────────────┐
│ 🔴 Ao Vivo            [Copiar] [Status] │
│ 🆕 Novidades          [Copiar] [Status] │
│ ⭐ Sugestões          [Copiar] [Status] │
│ 📅 Programação        [Copiar] [Status] │
└─────────────────────────────────────────┘
```

Mantém:
- Toggle "Adicionar UTM" (mais discreto, no topo da seção)
- `trackShare` em copy/open com `utm_campaign: share-<aba>` (rastreio do funil continua funcionando)
- `buildDeepLink` com `?tab=…` e UTMs

Remove:
- Bloco de preview com gradiente, ícone grande, host, título e descrição
- Input `utm_content` + chips de sugestão (continua possível usar via URL manual; se você quiser manter `utm_content` salvo por aba, posso deixar escondido em "avançado" — diga se quer)
- Exibição da URL completa (`<code>{link}</code>`)

### Sugestões opcionais (digo e você escolhe ao aprovar)

1. Mostrar um pequeno tooltip/`title` no botão `Copiar` com a URL final, para conferência sem poluir a UI.
2. Substituir os 2 botões por um único botão dividido (split): clique copia, ícone WhatsApp ao lado abre o status.
3. Manter o toggle UTM, mas escondê-lo atrás de um link "opções" para a seção ficar ainda mais limpa.
4. Adicionar um indicador minúsculo (•) ao lado do nome da aba quando UTM estiver ativo, para deixar claro que o link copiado é rastreado.

### Arquivos alterados

- `src/pages/admin/AdminWhatsApp.tsx` — substituir o JSX do bloco "Quick Tab Links" (~linhas 322-503) pela versão compacta. Sem mudanças em analytics, deep links ou backend.
