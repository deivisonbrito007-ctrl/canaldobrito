

# Auditoria e Melhorias da Aba Banners no Admin

## Bugs Encontrados

### 1. Link `?tab=programacao` nao funciona (BUG CRITICO)
O Dashboard e Quick Actions apontam para `/admin/banners?tab=programacao`, mas `AdminBanners` nao le o parametro `tab` da URL. O componente usa `useState("categories")` sem sincronizar com `useSearchParams`. O usuario clica em "Jogos Hoje" ou "Programacao" no dashboard e cai na aba Categorias.

**Correcao**: Adicionar `useSearchParams` em `AdminBanners` para ler o parametro `tab` e inicializar `activeSection` com base nele.

### 2. Botoes de reordenacao (setas) operam em escopo errado
O `moveBanner` busca o indice no array completo (`banners.findIndex`), mas os botoes up/down sao desabilitados com base no `idx` do loop dentro do grupo por data (`grouped[dateKey]!.map((banner, idx)`). Isso causa:
- Seta "up" desabilitada para o primeiro item do grupo, mas `moveBanner` opera no array global
- Se banners de datas diferentes tem sort_order intercalados, o swap pode trocar banners de grupos diferentes

**Correcao**: Passar o indice global ao inves do indice do grupo, ou ajustar `moveBanner` para operar com IDs adjacentes no array global.

### 3. Countdown de banners agendados nao atualiza em tempo real
Mesmo problema corrigido no `UpcomingActivations` — o `formatCountdown` dos banners agendados so atualiza quando os dados sao refetched, nao a cada minuto.

**Correcao**: Adicionar `setInterval` de 60s para forcar re-render (mesmo padrao do UpcomingActivations).

### 4. `useAllBanners` nao tem `refetchInterval`
Diferente de `useDailyGames` (que tem `refetchInterval: 60_000`), o hook `useAllBanners` nao tem refetch automatico. Banners agendados que sao ativados pelo cron nao aparecem atualizados ate refresh manual.

**Correcao**: Adicionar `refetchInterval: 60_000` ao `useAllBanners`.

## Melhorias Propostas

### 5. Adicionar confirmacao visual apos upload
Atualmente o toast aparece mas o usuario nao tem feedback visual claro de que o banner foi adicionado ao final da lista. Adicionar auto-scroll para o banner recem-adicionado.

### 6. Botao "Desativar todos" por categoria
Facilitar a limpeza de banners antigos — um botao que desativa todos os banners ativos da categoria selecionada de uma vez.

## Arquivos modificados
- `src/pages/admin/AdminBanners.tsx` — ler `?tab` da URL, corrigir indices de reordenacao, countdown ao vivo, auto-scroll apos upload, botao desativar todos
- `src/hooks/useBanners.ts` — adicionar `refetchInterval` ao `useAllBanners`

