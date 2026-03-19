

# Organização por Data + Correção do Agendamento 00:00

## Problemas identificados

1. **Storage de banners por categoria** usa path `categoria/timestamp.png` — sem organização por dia
2. **Storage de banners do dia** já usa `daily/data/timestamp.png` — OK
3. **Bug critico no agendamento 00:00**: o `publish_at` é salvo como `2026-03-20T00:00:00` (sem timezone). A Edge Function compara com `new Date().toISOString()` (UTC). Brasil é UTC-3, então meia-noite local = 03:00 UTC. O conteúdo seria ativado 3 horas antes (às 21h do dia anterior)
4. **Banners agendados por categoria**: mesmo problema de timezone no `scheduleDate`

## Correções

### 1. Organizar uploads de banners por categoria em pastas por data
- Path atual: `football/1679...png`
- Path novo: `football/2026-03-19/1679...png`

**Arquivo**: `AdminBanners.tsx` — alterar `uploadAndCreateCategory` para incluir data no path

### 2. Corrigir timezone no agendamento de Programação por Texto
- Atual: `publish_at = "${g.date}T00:00:00"` (ambíguo, sem timezone)
- Correto: `publish_at = "${g.date}T00:00:00-03:00"` (meia-noite no horário de Brasília)
- Alternativa robusta: usar offset do browser do admin com `new Date("${g.date}T00:00:00").toISOString()`

**Arquivo**: `ProgramacaoTexto.tsx` — corrigir `buildInsertPayload`

### 3. Corrigir timezone no agendamento de banners por categoria
- Converter `scheduleDate` para ISO com timezone local antes de salvar

**Arquivo**: `AdminBanners.tsx` — corrigir `uploadAndCreateCategory`

### 4. Edge Function — usar comparação consistente
- A Edge Function já usa `new Date().toISOString()` e `.lte("publish_at", ...)` — isso funciona corretamente se o `publish_at` for salvo em ISO com timezone. Sem alteração necessária na function.

### 5. Melhorar visualização de banners por data no admin
- Agrupar banners na listagem por data de criação (usando `created_at`) para facilitar a visualização

## Arquivos a editar

| Arquivo | Mudança |
|---------|---------|
| `AdminBanners.tsx` | Path de storage com data, fix timezone do scheduleDate, agrupar banners por data |
| `ProgramacaoTexto.tsx` | Fix timezone no publish_at (usar horário local do browser) |

## Detalhe técnico do fix de timezone

```typescript
// ANTES (bug): "2026-03-20T00:00:00" — sem timezone, interpretado como UTC
publish_at: `${g.date}T00:00:00`

// DEPOIS (correto): converte meia-noite local para ISO UTC
publish_at: new Date(`${g.date}T00:00:00`).toISOString()
// Em browser no Brasil (UTC-3), isso gera "2026-03-20T03:00:00.000Z"
// A edge function ativa corretamente à meia-noite local
```

