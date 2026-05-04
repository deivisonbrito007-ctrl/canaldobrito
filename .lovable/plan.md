## Decisão: usar TheSportsDB como API multi-esportes

Você tem razão — **não faz sentido** ativar BallDontLie + PandaScore + múltiplas chaves do API-Sports quando o **TheSportsDB Premium ($9/mês = "Pro Single")** já entrega tudo numa única API com **uma única chave**.

### Por que TheSportsDB resolve

| Esporte pedido | Coberto por TheSportsDB? |
|---|---|
| NBA, Tênis, Basquete, F1, MMA, Vôlei, Natação, Golfe, Beisebol, NFL | Sim — endpoint único `eventsday.php?d=YYYY-MM-DD&s=<Sport>` |
| Top 5 Europa, Champions, Eliminatórias | Sim — `eventsday.php?d=...&l=<idLiga>` ou `s=Soccer` |
| Canais de TV por evento | Sim — `lookuptv.php?id=<idEvent>` (bônus enorme: a parser manual hoje precisa do canal digitado à mão) |
| Livescores ao vivo | Sim — `livescore.php?s=<Sport>` (V2, premium) |

**Conclusão**: mantemos **API-Football** apenas para futebol (já está rodando) **OU** migramos tudo para TheSportsDB. Recomendo **migrar tudo para TheSportsDB** — uma fonte só, mais simples, e ainda traz os canais de TV automaticamente.

---

### Pergunta antes de detalhar a implementação

Preciso saber **uma coisa** antes de escrever os edge functions:

**Estratégia de fontes:**
- **A) Só TheSportsDB** (recomendado): remove a dependência da API-Football. Uma chave só, 14 esportes, canais de TV automáticos. Apago `fetch-games`/`update-live-games` antigos e crio novos baseados em TheSportsDB.
- **B) Híbrido**: mantém API-Football para futebol (já testado, status ao vivo confiável) e usa TheSportsDB **só** para os outros 13 esportes. Mais código, duas chaves, mas isola riscos.
- **C) Só adicionar TheSportsDB para os 13 esportes não-futebol** sem mexer no que já existe. Igual ao B, mas sem refatorar o que está funcionando.

---

### O que preciso de você antes de implementar

1. **Confirmar a estratégia (A, B ou C).**
2. **Adicionar a chave premium do TheSportsDB** como secret `THESPORTSDB_KEY` (quando você confirmar a estratégia, eu disparo o `add_secret` — não precisa colar aqui no chat).

---

### Resumo da implementação (após confirmação)

Independentemente da escolha, o trabalho será:

1. **Edge function nova** `sync-thesportsdb`:
   - Para cada esporte configurado (`Basketball`, `Tennis`, `Motorsport`, `Fighting`, `Volleyball`, `Swimming`, `Golf`, `Baseball`, `American Football`, `Soccer` se for opção A), chama `eventsday.php?d=<hoje>&s=<sport>`.
   - Mapeia `dateEvent` + `strTime` (UTC) para `game_time` em `America/Sao_Paulo`.
   - Insere em `daily_games` com `source='thesportsdb'`, `external_id=idEvent`, `sport_type=<nosso enum>`.
   - Chama `lookuptv.php?id=<idEvent>` apenas para eventos sem canal (preenche `channels` automaticamente).
   - Dedup pela mesma unique constraint `external_id` que já existe.

2. **Edge function** `update-live-thesportsdb` (a cada 5 min via cron):
   - Chama `livescore.php?s=<sport>` (V2 premium).
   - Atualiza `is_live`, `status_short`, `elapsed_minutes` por `external_id`.

3. **Migration**:
   - Adicionar `'thesportsdb'` como source válido (já é text livre, sem alteração de schema necessária).
   - Cron jobs: `sync-thesportsdb` 1×/dia 06:00 BRT + `update-live-thesportsdb` a cada 5 min.

4. **Painel admin** `/admin/api-sync`:
   - Nova seção "Sync TheSportsDB" com botões por esporte e seletor de data.
   - Mantém a seção API-Football (se opção B/C) ou substitui (opção A).

5. **Mapeamento de esportes TheSportsDB → enum local**:
   - `Soccer`→`football`, `Basketball`→`basketball`, `Tennis`→`tennis`, `Motorsport`→`f1`, `Fighting`→`mma`, `Volleyball`→`volleyball`, `Baseball`→`baseball`, `American Football`→`nfl`, `Golf`→`golf`, `Swimming`→`swimming`.

### Detalhes técnicos

- **Rate limit Premium**: ~100 req/min — folgadíssimo (10 esportes/dia + 288 livescores = ~300 req/dia).
- **Timezone**: TheSportsDB retorna `dateEvent` (data) + `strTime` (HH:MM:SS UTC). Convertemos no edge function com `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })` — mesma lógica já usada em `fetch-games`.
- **Canais TV**: `lookuptv.php` retorna array `tvevent` com `strChannel`. Mapeamos esses para o array `channels` do `daily_games`.
- **Sem novos schemas**: `daily_games` já tem `source`, `external_id`, `sport_type` — basta inserir com valores novos.

---

**Me diga A, B ou C, e se já posso disparar o `add_secret` para `THESPORTSDB_KEY`.**