## Diagnóstico do Admin de Banners

Analisei `AdminBanners.tsx`, `useBanners.ts` e `activate-scheduled`. A UI de upload/admin funciona, mas encontrei **3 bugs reais** que afetam o que o público vê:

### Bug 1 — Banners expirados continuam aparecendo no site público
`useActiveBanners` e `useBannersByCategory` filtram apenas `active=true`. Não checam `expires_at`. Resultado: um banner com `expires_at` no passado continua sendo exibido até alguém desativar manualmente. O cron `activate-scheduled` também só ativa agendados — nunca desativa expirados.

### Bug 2 — Banners agendados aparecem agrupados na data errada no admin
A lista agrupa por `created_at` (data do upload). Um banner com upload hoje e `publish_at` para daqui a 3 dias aparece no grupo de hoje, escondido entre os demais. O admin pensa que o banner já saiu / não acha o agendado.

### Bug 3 — Cron não limpa expirados
`supabase/functions/activate-scheduled/index.ts` ativa `banners` e `daily_games` futuros, mas não tem o passo inverso `active=false` para `banners` com `expires_at <= now`. Combinado com o Bug 1, dá efeito de "banner zumbi".

### Sugestão extra (opcional, pequena)
Indicador visual no cabeçalho da categoria mostrando o `próximo evento` (próximo `publish_at` futuro ou próximo `expires_at`), tipo: `⏰ Próxima ativação: amanhã 06h00`. Já temos `UpcomingActivations` no admin geral, mas falta dentro da categoria.

---

## Mudanças propostas

### 1. `src/hooks/useBanners.ts` — filtrar expirados no query
Em `useActiveBanners` e `useBannersByCategory`, adicionar:
```text
.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
```
E reduzir `staleTime` de `useActiveBanners` para `30_000` (hoje é 60s — atrasa a expiração visual).

Também filtrar `publish_at` no client se vier `active=true` com `publish_at > now` (defesa em profundidade caso cron atrase).

### 2. `src/pages/admin/AdminBanners.tsx` — agrupar pela data efetiva
Trocar `groupedByDate` para usar:
```text
const effectiveDate = banner.publish_at ?? banner.created_at;
```
Assim, banners agendados aparecem no grupo do dia em que vão ser publicados. Header do grupo ganha sufixo `(agendado)` quando o grupo é uma data futura.

### 3. `supabase/functions/activate-scheduled/index.ts` — desativar expirados
Adicionar um quarto bloco (depois de ativar agendados):
```text
UPDATE banners SET active = false WHERE active = true AND expires_at <= now()
```
Incluir contagem `deactivated_expired_banners` no resultado.

### 4. (Opcional, com confirmação) `BannerHealthPanel` ou um chip novo no cabeçalho da categoria mostrando próximo `publish_at`/`expires_at` da categoria atual.

---

## Risco

- Filtrar expirados no client pode esconder banners cuja `expires_at` foi setada por engano. Mitigação: o admin continua vendo TUDO (`useAllBanners` não muda).
- Reagrupar por `publish_at` muda o visual da lista. O `BannerCard` já mostra status "Agendado" individualmente, então a ordem nova fica mais coerente, não pior.
- A migração no edge function é só lógica adicional — não toca schema, não precisa de migration SQL.

Confirma os 3 fixes (1, 2, 3) e me diz se quer também o item 4 (chip de próximo evento)?