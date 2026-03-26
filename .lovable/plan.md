

## Melhorar o Resumo de Jogos na Pagina WhatsApp

### Problema
A pagina WhatsApp ja tem uma secao "Jogos do Dia" que gera texto automatico dos jogos cadastrados, mas o formato e basico — tudo numa linha so. O botao "Copiar resumo" da Programacao exige varios passos (colar texto, processar, selecionar). O ideal e ter o resumo bonito direto no WhatsApp.

### O que sera feito

Melhorar o formato do texto gerado na secao "Jogos do Dia" do `AdminWhatsApp.tsx` para usar o mesmo estilo rico do "Copiar resumo":

**Formato atual:**
```
⏰ 19:00 — Flamengo x Palmeiras (Brasileirão) — Sportv, Premiere
```

**Formato novo:**
```
⚽ *FUTEBOL*

19:00 — Flamengo x Palmeiras
🏆 Brasileirão | 📺 Sportv, Premiere

21:00 — Barcelona x Real Madrid
🏆 La Liga | 📺 ESPN

🏀 *BASQUETE*

20:00 — Lakers x Celtics
🏆 NBA | 📺 ESPN 2
```

### Alteracoes

**`src/pages/admin/AdminWhatsApp.tsx`**

1. Importar `SPORT_EMOJI` e `SPORT_LABEL` de `@/lib/gameUtils` (remover o mapa local duplicado)
2. Reescrever o `gamesText` useMemo para:
   - Ordenar jogos por horario dentro de cada grupo
   - Formatar cada jogo em 2 linhas (time + competicao/canais separados)
   - Usar `SPORT_LABEL` em maiusculas no header
3. Manter os botoes Copiar e Enviar como estao

### Arquivo modificado
- `src/pages/admin/AdminWhatsApp.tsx`

