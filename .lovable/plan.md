## Mudanças em `src/pages/AgendaPublica.tsx`

### 1. Restaurar barra inferior com 3 ações
Voltar a sticky bar no rodapé com **Copiar | WhatsApp | Compartilhar** (Web Share API).

### 2. Mensagem personalizada (curta) com link
Trocar o texto longo (`buildDayText`) por uma mensagem enxuta + link da `/agenda?date=…`:

```
🔥 *AGENDA DE HOJE — Canal do Brito*
Quarta, 13/05 · 24 jogos

⚽ 12 Futebol  🏀 5 Basquete  🥊 2 UFC

Veja todos os jogos e canais 👇
https://canaldobrito.site/agenda?date=2026-05-13
```

- Nova função `buildShareMessage(games, date, siteUrl)` em `src/lib/whatsappText.ts`.
- `buildDayText` (admin) intacta.
- Sem menção a "Assine" no texto compartilhado.

### 3. Botão "Assine já" na página → leva para `/assinar`
CTA visível, idêntico em destino ao do portal (`AppNavbar` e `PromoStrip` já apontam para `/assinar` — a página `Assinar.tsx` é a explicativa de assinatura).

Posicionamento: **bloco verde abaixo do header**, antes da faixa AO VIVO. Mesmo padrão visual do `PromoStrip` do portal, ajustado ao tema escuro da página pública:

```
┌────────────────────────────────────────┐
│  ✨ Assine o Canal do Brito         →  │
│  Acesso completo · R$ 35/mês           │
└────────────────────────────────────────┘
```

- `<Link to="/assinar">` (mesma rota do portal).
- Fundo `#00ff87`, texto `#07080a`, `Sparkles` à esquerda, `ChevronRight` à direita.
- Sempre visível (independente de jogos / data).
- Aparece **apenas na página**, nunca na mensagem.

### Sugestões opcionais
- Adicionar um segundo CTA discreto **"Assinar"** no rodapé fixo (ao lado dos 3 botões de share) para conversão dupla.
- Reusar/extrair o `PromoStrip` do portal como componente compartilhado, em vez de duplicar markup. Mantém consistência visual e centraliza copy do plano.

## Arquivos afetados
- `src/pages/AgendaPublica.tsx` — restaurar barra de share, novos handlers usando `buildShareMessage`, adicionar CTA "Assine já".
- `src/lib/whatsappText.ts` — adicionar `buildShareMessage()` (sem mexer em `buildDayText`).
- *(opcional)* extrair `PromoStrip` para versão reutilizável.

Sem migrações, sem mudanças de schema.
