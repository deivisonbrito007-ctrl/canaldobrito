# Refinar hierarquia visual mobile da aba "Ao Vivo"

## Mudanças em `src/components/public/LivePageContent.tsx`

### 1. Hero compacto
- Reduzir padding `p-3 sm:p-4` → `px-3 py-2.5`.
- Linha única: badge `● AO VIVO` + título inline + relógio menor à direita.
- Remover blob de glow redundante (`-top-10 -right-10`).
- Pills de filtro só aparecem se houver **2+ esportes diferentes** ao vivo.

### 2. Aviso dispensável (`LiveNotice`)
- Adicionar botão `X` para fechar.
- Persistir dismissal em `localStorage` (`live-notice-dismissed-v1`).
- Reduzir para 1 linha com texto truncado.

### 3. Header "Acontecendo agora" mais leve
- `text-sm font-extrabold` → `text-[11px] uppercase tracking-wider`. Cards passam a ser o protagonista visual.

### 4. Banner "Começam em breve" → header inline compacto
- Substituir bloco de ~110px por header de ~36px:
  `🏆 PRÓXIMOS · em 13min  [1]` com barra fina inline.
- Remove redundância visual com card `★ Próximo` logo abaixo.

### 5. Deduplicar live × upcoming
- Filtrar de `upcoming` qualquer game cujo `competition + home_team` já apareça em `liveGames`.
- Evita "Italian Open" listado duas vezes.

### 6. Card `★ Próximo` mais discreto
- Mover badge para dentro do card (sem `-top-2` flutuante).
- `ring-2` → `ring-1` para não competir com a borda do esporte.

## Resultado
~180px recuperados na primeira dobra mobile. Hierarquia clara: cards = protagonistas, headers = coadjuvantes.
