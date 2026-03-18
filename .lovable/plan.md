

# Melhorias no Sistema "AO VIVO" e "Programacao do Dia"

## Analise

O sistema ja tem:
- Parser funcional em `ProgramacaoTexto.tsx` que extrai jogos de texto estruturado
- `DailyGamesSection.tsx` com logica de ao vivo (`isGameLive`) e agrupamento por periodo
- Filtros por canal, cards expandiveis, badges de competicao

O que precisa melhorar:
1. **Parser**: nao trata `14h` (sem minutos), canais com separadores complexos como "e" no meio de listas longas
2. **Ao Vivo**: nao mostra minuto aproximado do jogo, cards sao grandes demais para scroll horizontal
3. **Destaque**: nao diferencia Champions League de jogos menores
4. **Separacao**: Ao Vivo e Programacao estao no mesmo componente, dificultando reutilizacao

## Plano de Implementacao

### 1. Melhorar o Parser (`ProgramacaoTexto.tsx`)

- Tratar formato `14h` (sem minutos) alem de `14h30` — regex: `/(\d{1,2})[hH](\d{2})?/`
- Melhorar split de canais para tratar ", " e " e " corretamente em sequencias como "Canal GOAT, Sportv 2, BandSports, Bandplay, Band.com.br e Esporte na Band (YouTube)"
- Detectar `(F)` para marcar `is_womens` (ja existe, apenas validar)
- Extrair `competition_detail` de parenteses como "(oitavas de final)", "(semifinal)" (ja existe, validar edge cases)

### 2. Criar `LiveNowSection.tsx` (novo componente)

Componente dedicado para jogos ao vivo, separado da programacao:
- Usa `useDailyGames(today)` com filtro `isGameLive()`
- Calcula minuto aproximado: `Math.floor((now - gameStart) / 60000)` exibindo ex: "32'" ou "2T" se > 45min
- Cards compactos em scroll horizontal (`min-w-[240px]`)
- Badge vermelho pulsante "AO VIVO" com dot animado
- Borda vermelha com `animate-border-pulse-live`
- Badge de destaque "Destaque" para Champions League, Brasileirao, Libertadores
- Retorna `null` se nenhum jogo ao vivo

### 3. Refatorar `DailyGamesSection.tsx`

- Remover toda a logica de "Ao Vivo" (movida para `LiveNowSection`)
- Manter apenas jogos futuros (nao ao vivo)
- Melhorar agrupamento: Manha (ate 13h), Tarde (13h-18h), Noite (18h+)
- Adicionar badge "Destaque" para competicoes principais
- Manter filtros por canal
- Cards mais limpos: remover expand/collapse, mostrar todos os canais inline

### 4. Atualizar `Index.tsx`

- Importar `LiveNowSection` e posicionar logo apos o Hero
- `DailyGamesSection` abaixo do `LiveNowSection`
- Ordem: Hero → Ao Vivo → Programacao → Novidades → Assista Hoje → Footer

### 5. CSS/Visual

- Adicionar competicoes de destaque: Champions League, Brasileirao, Libertadores, Copa do Brasil → badge "Destaque" com icone de fogo
- Badge feminino rosa para jogos com `(F)`
- Glow verde sutil nos cards de destaque

## Arquivos Modificados

| Arquivo | Acao |
|---|---|
| `src/components/admin/ProgramacaoTexto.tsx` | Melhorar parser (horarios, canais) |
| `src/components/public/LiveNowSection.tsx` | **Criar** — secao ao vivo dedicada |
| `src/components/public/DailyGamesSection.tsx` | Refatorar — remover ao vivo, simplificar cards |
| `src/pages/Index.tsx` | Reordenar secoes |

