## Diagnóstico

Inspecionei `daily_games` e identifiquei a causa dos **canais repetidos no mesmo horário**:

As regex de fallback em `supabase/functions/sync-thesportsdb/index.ts` estão **genéricas demais** e casam com nomes de ligas estrangeiras que **não têm transmissão no Brasil**, espalhando os mesmos canais em dezenas de jogos:

| Regex atual | Casa indevidamente | Resultado errado |
|---|---|---|
| `\bpremier league\b` | Ethiopian / Singapore / Bahrain / Iraqi / Israeli / Egyptian Premier League | Todos viram "ESPN Brasil + Disney+" |
| `\bligue 1\b` | DR Congo Ligue 1, Ivory Coast Ligue 1 | Viram "Cazé TV + Xsports" |
| `\bserie a\b` | Ethiopian Serie A etc. | "ESPN Brasil + Disney+" |
| `\bf1\b` / `\bfifa\b` / `\bsuperliga\b` | Strings curtas dentro de outros nomes | Falsos positivos |

Exemplos reais hoje (05/05): "Ethiopian Premier League", "Iraqi Premier League", "Bahrain Premier League", "Azerbaijani Premier League", "Singapore Premier League" — todos com `["ESPN Brasil", "Disney+"]`.

## Correção

**1. Bloquear ligas estrangeiras antes do fallback** — adicionar `FOREIGN_LEAGUE_BLOCKLIST` (regex com ~80 nacionalidades/regiões: ethiopian, iraqi, bahrain, dr congo, ivory coast, azerbaijani, israeli, saudi, qatari, indian, chinese, korean, indonesian, polish, czech, etc.). Se o nome da competição casar, **não aplica fallback**.

**2. Tornar regex de competições européias estritas** exigindo qualificador:
- `premier league` → `english premier league | premier league england | epl`
- `ligue 1` → `french ligue 1 | ligue 1 france`
- `serie a` → `italian serie a | serie a italy | calcio | lega calcio`
- `la liga` → `la liga | laliga | spanish la liga`
- `world cup` → `fifa world cup | copa do mundo`
- `f1` → `formula 1 | f1 grand prix | fia formula 1`
- `superliga` → `superliga brasil` (havia colisão com superligas estrangeiras)
- Tênis: remove `atp/wta` genéricos, mantém só **Grand Slams** (que têm transmissão BR)

**3. Combinar com filtro já existente** — eventos sem canal real (vindo de `eventstv.php`) e sem fallback continuam descartados, conforme já implementado.

**4. Limpeza retroativa do banco** — `DELETE` em `daily_games` onde:
- `source = 'thesportsdb'` E
- `competition` casa o blocklist de ligas estrangeiras

Isso remove imediatamente os ~50+ jogos de ligas africanas/asiáticas que ficaram com canais BR falsos.

## Arquivos afetados

- `supabase/functions/sync-thesportsdb/index.ts` — adiciona `FOREIGN_LEAGUE_BLOCKLIST`, refina cada regex de `BROADCAST_FALLBACK`, gate `lookupBroadcastFallback` para retornar `[]` em ligas bloqueadas.
- Migration de limpeza: `DELETE FROM daily_games WHERE source='thesportsdb' AND competition ~* '<blocklist>'`.

## Sugestões adicionais

- **Painel admin "Sync Stats"**: mostrar top-20 competições do `noChannelByCompetition` e do `fallbackHits`, para você auditar o que entrou/saiu por competição a cada sync.
- **Tabela `broadcast_overrides` no banco** (futuro): pares `competition_pattern → channels[]` editáveis pelo admin sem redeploy.
- **Modo "estrito"**: opção de só publicar jogos com canal vindo de `eventstv.php` (ignorando todo fallback) — útil se quiser zero-falso-positivo.

Quer que eu já implemente as 3 sugestões junto, ou só a correção principal?