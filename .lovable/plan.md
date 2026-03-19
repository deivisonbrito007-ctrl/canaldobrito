

# Auditar Banners + Testes + Verificar Agendamento Automatico

## 1. Auditoria do fluxo de Categorias (Banners)

**OK - Funcionando:**
- Upload via arquivo e PasteZone
- Agendamento com `publish_at` / `active: false`
- Toggle ativo/inativo, reordenacao, exclusao
- Query publica filtra `active: true`
- 6 categorias renderizadas no frontend

**Problemas encontrados:**
1. **Import nao usado**: `Calendar` importado mas nunca utilizado no AdminBanners
2. **Reordenacao por grupo**: botao down desabilitado por indice do grupo de data, nao da lista global -- pode causar inconsistencia de `sort_order`

## 2. Verificacao do Sistema de Agendamento Automatico

**Status atual (logs):** A Edge Function `activate-scheduled` esta rodando a cada minuto via pg_cron e retornando `activated_banners: 0, activated_games: 0` sem erros -- funcionando corretamente.

**O que sera verificado/testado:**
- Invocar a Edge Function diretamente e confirmar resposta 200
- Consultar o banco para verificar se existe algum banner com `publish_at` pendente e `active = false`
- Confirmar que o cron job esta registrado no `cron.job` table
- Verificar que a referencia a `daily_banner` NAO existe na Edge Function (ja confirmado -- nao existe, so `banners` e `daily_games`)

**Acoes se necessario:**
- Se o cron job nao estiver registrado, criar via SQL direto (nao migration) com a URL e anon key corretas

## 3. Testes Unitarios

### `src/lib/dateUtils.ts` (novo)
- Extrair `formatCountdown` do AdminBanners para arquivo testavel

### `src/lib/dateUtils.test.ts` (novo)
- Testar: "Em breve" (passado), minutos, horas, dias, "amanha"

### `src/components/public/__tests__/BannerSections.test.tsx` (novo)
- Testar render com banners mockados por categoria
- Testar estado vazio e skeleton

### `src/pages/admin/__tests__/AdminBanners.test.tsx` (novo)
- Testar render das category pills
- Testar troca de categoria

### Rodar suite completa apos criar os testes

## 4. Melhorias UI

- Remover import `Calendar` nao usado
- Adicionar drag-and-drop na PasteZone (alem do paste)

## Resumo

| Arquivo | Mudanca |
|---------|---------|
| `src/lib/dateUtils.ts` | Novo -- extrair formatCountdown |
| `src/lib/dateUtils.test.ts` | Novo -- testes |
| `src/components/public/__tests__/BannerSections.test.tsx` | Novo -- testes |
| `src/pages/admin/__tests__/AdminBanners.test.tsx` | Novo -- testes |
| `src/pages/admin/AdminBanners.tsx` | Remover Calendar import, importar formatCountdown de dateUtils |
| `supabase/functions/activate-scheduled` | Verificar execucao via invoke + logs |
| Verificar cron job no banco | Query `cron.job` para confirmar registro |

