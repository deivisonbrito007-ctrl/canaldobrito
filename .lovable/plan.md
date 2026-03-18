

## Adicionar Ligas e Esportes Faltantes

Baseado nas imagens de referência, o app precisa cobrir muito mais esportes e ligas além de futebol e basketball. Vou listar o que falta e o plano para adicionar.

### Esportes e ligas faltantes (referência das imagens)

**Soccer (já parcial):** MLS, Saudi Pro League (liga saudita), Serie A italiana (já tem ID 135 mas falta no channel map)

**Basketball (já parcial):** WNBA, College Basketball (NCAAB/NCAAW)

**Novos esportes a adicionar:**
- **Football Americano:** NFL, NCAAF (College)
- **Baseball:** MLB, College Baseball
- **Tennis:** ATP, WTA
- **Fórmula 1**
- **MMA/UFC**
- **Hockey:** NHL
- **Golf:** PGA Tour

### Plano de implementação

#### 1. Atualizar tipos (`src/types/sports.ts`)
- Expandir `SportType` para: `"football" | "basketball" | "tennis" | "american_football" | "baseball" | "motorsport" | "mma" | "hockey" | "golf"`
- Atualizar array `SPORTS` com label, ícone e cor para cada

#### 2. Migração no banco de dados
- Adicionar novos valores ao enum `sport_type`: `tennis`, `american_football`, `baseball`, `motorsport`, `mma`, `hockey`, `golf`

#### 3. Edge Function — novas fontes de dados
O problema é que cada esporte usa APIs diferentes. Para os esportes novos, como não temos APIs configuradas, a estratégia será:
- **API-Football**: Adicionar ligas faltantes (MLS id=253, Saudi Pro League id=307)
- **BallDontLie**: Já cobre NBA. WNBA/College não são suportados por essa API
- **Demais esportes**: Cadastro manual pelo Admin até configurarmos APIs específicas

#### 4. Atualizar Channel Map na Edge Function
```
"MLS": "Apple TV+",
"Saudi Pro League": "BandSports / CazéTV",  
"Serie A": "ESPN / Star+",  (Itália - já tem ID mas falta canal)
"NFL": "ESPN / NFL Game Pass",
"MLB": "ESPN",
"ATP": "ESPN / SporTV",
"WTA": "ESPN / SporTV",
"Formula 1": "Band / F1 TV",
"UFC": "Combate / UFC Fight Pass",
"NHL": "ESPN",
"PGA Tour": "ESPN",
```

#### 5. Atualizar API-Football leagues array
Adicionar IDs:
- 253 (MLS)
- 307 (Saudi Pro League)  
- 262 (Liga MX)
- 94 (Primeira Liga - Portugal)
- 34 (World Cup 2026 Qualifiers)

#### 6. Atualizar SportFilter e Admin
- `SportFilter.tsx`: Mostrar todos os esportes com contadores
- `Admin.tsx`: Adicionar novos esportes ao select e novos canais ao datalist

#### 7. Atualizar `apiSource` type
- Adicionar tipo para fontes futuras ou manter `manual` como default para esportes sem API

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/types/sports.ts` | Expandir SportType e SPORTS array |
| `supabase/functions/sync-daily-games/index.ts` | Adicionar ligas (MLS, Saudi, Portugal, etc) + canais |
| `src/pages/Admin.tsx` | Novos esportes no select, novos canais |
| `src/components/SportFilter.tsx` | Suportar mais esportes no filtro |
| Banco de dados (migração) | Adicionar valores ao enum `sport_type` |

