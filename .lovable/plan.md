

## Adicionar botão "Copiar resumo" na ProgramacaoTexto

### O que será feito

Adicionar um botão **"Copiar resumo"** na barra de ações do Step 3 (Preview) que gera texto formatado dos jogos selecionados, agrupados por data e esporte, com emojis — pronto para colar no WhatsApp.

### Formato do texto gerado

```text
📅 Programação 20/03

⚽ FUTEBOL
19:00 — Flamengo x Palmeiras
🏆 Brasileirão | 📺 Sportv, Premiere

21:00 — Barcelona x Real Madrid
🏆 La Liga | 📺 ESPN

🎾 TÊNIS
15:00 — Nadal x Djokovic
🏆 Roland Garros | 📺 ESPN 2
```

### Alterações

**`src/components/admin/ProgramacaoTexto.tsx`**

1. Criar função `generateWhatsAppSummary(games: ParsedGame[])` que:
   - Filtra apenas jogos selecionados
   - Agrupa por data, depois por `sport_type`
   - Formata cada jogo como `HH:MM — Home x Away` (ou só `Home` se sem away)
   - Adiciona linha de competição e canais
   - Retorna string formatada

2. Adicionar botão `"📋 Copiar resumo"` ao lado dos botões Publicar/Republicar, usando `navigator.clipboard.writeText()` e `toast.success("Resumo copiado!")`

### Arquivos modificados
- `src/components/admin/ProgramacaoTexto.tsx` — nova função + botão

