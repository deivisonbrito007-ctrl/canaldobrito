## Diagnóstico

Inspecionei `daily_games` e `audit_logs`. O sync **está rodando OK** (214 jogos hoje, 27 com canais), mas a heurística atual em `sync-thesportsdb/index.ts` aceita **falsos positivos massivos**:

- `Sport TV 1/2/3` = **SporTV de Portugal**, regex `\bsport\s*tv\b` confunde com SporTV BR
- `ESPN Argentina / Mexico / Peru / Nicaragua / Netherlands` = ESPN regional, não passa no BR (regex `\bespn\b` aceita qualquer um)
- `TNT Mexico / TNT Brasil` misturados — só o `TNT Brasil` deveria passar
- `MLB.tv / NBA League Pass / NHL+ / NFL+` = passes pagos sem versão localizada BR

Também notei: dos 187 jogos sem canal, a maioria é nicho regional (KBO coreano, NPB japonês, ligas chinesas) que o TheSportsDB não tem mesmo TV BR. Isso é esperado — não passa no Brasil.

## Correção

Reescrever a heurística em `supabase/functions/sync-thesportsdb/index.ts` (linhas 121-161) com 3 camadas:

1. **Blocklist de países**: rejeitar `strCountry` ∈ {Argentina, Mexico, Portugal, USA, Netherlands, etc.} mesmo que o nome do canal pareça BR.
2. **Blocklist de sufixos no nome**: regex `FOREIGN_REGION_RE` rejeita qualquer canal que contenha `argentina|mexico|peru|portugal|netherlands|...` no nome (pega `ESPN Argentina`, `TNT Mexico`, `Sport TV 1` se vier `strCountry=Portugal`).
3. **Whitelist BR refinada**: 
   - `\bsportv\b` (sem espaço) em vez de `\bsport\s*tv\b` 
   - `\bespn\s*(brasil|br)\b` em vez de `\bespn\b`
   - `\btnt\s*sports\s*(brasil|br)?\b` (precisa "sports", elimina "TNT Mexico")
   - Remover `\bgoat\b`, `\bspace\b`, `\bn\s*sports\b` (genéricos demais)
   - Remover MLB.tv/NBA League Pass/NHL+/NFL+ (não têm distribuição BR oficial garantida)
4. Manter aceitar `strCountry === "Brazil"` automaticamente.

## Sugestões adicionais

- **Fallback BROADCAST_FALLBACK por liga**: para Brasileirão/Libertadores/NBA/NFL/F1/UFC, hardcodar canais conhecidos (ex: Libertadores → "Paramount+, SBT, ESPN Brasil") quando o `eventstv.php` não trouxer canal BR. Cobre 80% dos jogos populares mesmo sem dado da API.
- **Limpeza retroativa**: rodar `UPDATE daily_games SET channels = '{}' WHERE source='thesportsdb' AND channels && ARRAY['Sport TV 1','Sport TV 2','Sport TV 3','ESPN Argentina','ESPN 2 Peru','TNT Mexico','MLB.tv',...]` para remover lixo já gravado, depois disparar o sync manual de novo.
- **Tela Sync Stats**: adicionar lista das marcas de canal mais frequentes (top 20) por execução, ajuda a calibrar a regex.

## Arquivos

- `supabase/functions/sync-thesportsdb/index.ts` (linhas 121-161): nova função `isBrazilChannel` com BLOCK_COUNTRIES + FOREIGN_REGION_RE + whitelist refinada.
- (Opcional) Migration de limpeza dos canais incorretos já gravados.
- (Opcional) `AdminSyncStats.tsx`: top de marcas de canal.

Quer que eu implemente os 3 itens (filtro + limpeza + top marcas) ou só o filtro?
