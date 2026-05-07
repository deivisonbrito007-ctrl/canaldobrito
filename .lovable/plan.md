## Auditoria — Aba Admin → Analytics

### Como funciona hoje
- Página: `src/pages/admin/AdminAnalytics.tsx` (rota `/admin/analytics`).
- Fontes de dados:
  - **Local (`localStorage`)** — `readEventsLog()` lê `cb:events_log` (até 500 eventos). Usado para os blocos "Eventos / Visitantes / Sessões", "Por utm_campaign" e "Por tab_view".
  - **Remoto (`analytics_events`)** — query no Supabase com limite de 5000, filtrada pela união dos períodos A+B. Usado para "Funil WhatsApp", "Tendência diária" e "Funil por aba".
- Eventos atualmente registrados (verificado no banco): `tab_view` (606), `landing_with_utm` (34), `link_share` (14). Sem `content_card_click` populado — a função existe mas só dispara se a sessão tem UTM, e nada nos resultados ainda.
- Comparador A vs B funcional, presets 24h/7d/30d/90d, gráfico Recharts, deltas % com setas.

### Problemas encontrados

**Bugs / Inconsistências**
1. **Mistura de fontes de dados** confunde o usuário: KPIs do topo + tabela de campanhas/abas vêm do localStorage (parcial, no máx. 500 eventos do navegador atual), mas Funil/Tendência/Funil-por-aba vêm do banco. Resultado: números diferentes para a mesma campanha em duas seções.
2. **`computeDaily` quebra ao virar mês**: o `while` incrementa `Date` com `setHours(12,...)` e compara strings ISO; em janelas longas (90d) que cruzam horário de verão fictício isso seria um problema — embora o projeto trave UTC-3 sem DST, a conversão `new Date(d - 3h).toISOString()` entrega o dia em SP corretamente, mas pode pular o último dia se `to` estiver às 23:59 e `cursor.setHours(12)` ficar antes. (Ver memória "Temporal Sync Logic".)
3. **Limite de 5000 eventos** sem aviso. Em 90d isso pode estourar silenciosamente e mostrar números errados.
4. **`window.confirm`** em "Limpar" — substituir por `AlertDialog` para coerência com Canais & Logos.
5. **Tipagem do client Supabase** com cast manual gigante (linhas 340–352). Já existe tipo gerado.
6. **Sem realtime/auto-refresh** — admin precisa clicar manualmente em "Atualizar".
7. **`content_card_click` zerado** — payload do evento tem dados ricos (surface/content_type/content_title/position) mas a aba não tem nenhuma seção para visualizá-los.
8. **Teste falhando**: `ChannelLogoUpload.test.tsx` quebrou após a normalização de logo (jsdom não tem `createImageBitmap`/canvas). Precisa mockar `@/lib/normalizeLogo` no teste — já passou em 330/331, falta esse 1.

**Compatibilidade Mobile (320–430px)**
9. Container usa `max-w-5xl mx-auto p-4 sm:p-6` ✓ ok.
10. **Tabelas com `overflow-x-auto`** ✓ funcionam, mas em 320px o usuário precisa scroll horizontal sem indicação visual. Falta scroll-snap ou hint.
11. **Botões "Atualizar/Limpar"** no header não têm `min-h-11` — abaixo do mínimo de 44px da memória de UX.
12. **Presets em `min-h-[36px]`** — também abaixo de 44px.
13. **Calendar Popover** desktop-first — em telas estreitas o picker estoura à esquerda quando aberto no campo "→". Precisa `align="end"` no segundo botão.
14. **Gráfico `h-56`** com legend de 10px — ok, mas eixo Y `tickFormatter` pode cortar `100%`. `-ml-2` força conteúdo a colidir com a borda do Card em telas pequenas.
15. **Sem safe-area inset-bottom** no rodapé (memória Core).

**UX / Visual**
16. Sem tab/segmentação interna entre "Eventos locais" vs "Banco de dados" — dois conjuntos de cards/tabelas misturados verticalmente.
17. Sem CTA para exportar CSV dos dados filtrados (útil para análise externa).
18. Sem indicador de "última atualização".
19. Sem busca/filtro por campanha/aba na tabela "Por utm_campaign" (já tem dropdown só no gráfico).
20. Sem skeleton durante `loadingRemote` (fica em branco).

### Plano de melhorias

#### A. Correções críticas
- **Fix do teste quebrado**: adicionar `vi.mock("@/lib/normalizeLogo")` em `ChannelLogoUpload.test.tsx` para devolver o file original (jsdom não suporta canvas).
- **Substituir `window.confirm`** por `AlertDialog` na ação Limpar (consistência + acessibilidade).
- **Aviso de limite**: se a query bater 5000 linhas, mostrar banner âmbar "Limite atingido — encurte o período ou habilite paginação".

#### B. Unificar fonte de dados
- Migrar KPIs do topo + tabela "Por utm_campaign" + tabela "Por tab_view" para o **banco** (`analytics_events`), descartando a leitura do `localStorage` no Admin (mantém o log local só como fallback de debug, escondido atrás de um expander "Log local (debug)").
- Resultado: todos os números batem entre seções.

#### C. UX/Mobile
- Header: `min-h-11`, botões 44px, "Atualizar" mostra timestamp ("atualizado há 2min").
- Presets: `min-h-11` e `aria-pressed` no preset ativo.
- Segundo `DateButton` com `align="end"` para não estourar à esquerda no mobile.
- Tabelas com sticky-first-column ou um chip "deslize →" quando há overflow.
- Skeletons shimmer (memória Core) durante `loadingRemote`.
- Aplicar `pb-[env(safe-area-inset-bottom)]` no container.
- Remover `-ml-2` do gráfico, usar `pl-0` no Card e `margin.left=8`.

#### D. Funcionalidades novas
- **Botão Exportar CSV** (mesmo padrão de "Exportar JSON" de Canais): exporta os eventos filtrados do período A.
- **Seção "Top conteúdo clicado"**: agrupa `content_card_click` por `content_title` + `surface` (vai ficar útil quando esse evento começar a popular).
- **Auto-refresh opcional**: switch "Tempo real" — usa Supabase Realtime em `analytics_events` para invalidar/recalcular sem clicar.
- **Quick-filter por aba** dentro da tabela de campanhas (chips clicáveis para filtrar a tabela inteira).
- **Cards de "Saúde do tracking"**: mostra contagem de `link_share` sem `tab_slug`, `landing_with_utm` sem `utm_campaign`, etc — diagnóstico para identificar pixel/UTM mal-configurado.

#### E. Verificação
- Rodar `bunx vitest run` e garantir 331/331 verdes.
- Browser test pós-implementação: navegar `/admin/analytics` em viewport 390×844, validar render, presets, troca de período, gráfico, comparação A/B, export CSV, scroll horizontal das tabelas.

### Resultados da suíte de testes (rodada agora)
- **330 passing / 1 failing** (44 arquivos):
  - ❌ `src/components/admin/__tests__/ChannelLogoUpload.test.tsx` → "uploads valid PNG and emits public URL" (quebrou após auto-normalize: jsdom sem `createImageBitmap`).
  - Será corrigido no item A.

### Sugestões adicionais (fora do escopo se quiser priorizar)
- **GA4 / PostHog**: o código já dispara para `gtag/posthog/plausible` se presentes. Plugar PostHog dá retenção/funil real sem precisar reinventar — deixaria o Admin focado em "tracking de campanhas WhatsApp".
- **Retention/cohort por anon_id**: requer view materializada no banco; adiciono migration depois se topar.
- **Heatmap por hora do dia**: matriz 24×7 de tab_view — mostra melhores horários para mandar a campanha no Whats.

---

Posso seguir com **A + B + C + D (export CSV + saúde do tracking)** numa única passada? Realtime/PostHog ficam para depois conforme aprovar.
