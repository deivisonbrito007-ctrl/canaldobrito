

# Redesign dos Filtros e Stats Bar — Layout Limpo e Profissional

## Problema

A área entre o Hero e os cards tem **4 barras horizontais empilhadas** (stats, esportes, competições, canais) que ocupam ~200px de altura vertical, parecem repetitivas e amadoras. Muita informação visual competindo por atenção.

## Solução: Consolidar em 2 elementos compactos

### 1. Unificar Stats Bar dentro do Header
Remover o componente `DayStatsBar` como barra separada. Integrar o total de jogos e o indicador "ao vivo" diretamente no header da seção (já tem o badge "22 jogos"). Os ícones de esporte por contagem são redundantes com o filtro de esportes — eliminar.

### 2. Sistema de filtros em abas colapsáveis (accordion de filtro único)
Em vez de 3 barras empilhadas, usar **uma única linha de filtro** com seletor de categoria:

```text
┌─────────────────────────────────────────────────┐
│ [Esporte ▾]  [Competição ▾]  [Canal ▾]  [✕]    │
├─────────────────────────────────────────────────┤
│ (pills da categoria selecionada aparecem aqui)  │
└─────────────────────────────────────────────────┘
```

- **3 botões compactos** no topo: "Esporte", "Competição", "Canal"
- Ao tocar em um, expande **uma única linha** de pills abaixo (como um dropdown inline)
- Apenas uma categoria aberta por vez (accordion)
- Quando um filtro está ativo, o botão mostra o valor selecionado (ex: "⚽ Futebol" em vez de "Esporte")
- Botão "✕" para limpar todos os filtros
- Se nenhum filtro ativo e nenhuma categoria aberta, ocupa apenas **1 linha** (~40px)

### 3. Chips de filtro ativo
Quando filtros estão ativos, mostrar chips abaixo dos botões:
```text
[⚽ Futebol ✕]  [ESPN 2 ✕]
```
Compacto, clicável para remover individualmente.

## Arquivos modificados

- `src/components/public/DailyGamesSection.tsx` — redesign completo da área de filtros: remover 3 barras, criar sistema accordion compacto com chips de filtro ativo
- `src/components/public/DayStatsBar.tsx` — simplificar ou remover (integrar live count no header)

## Resultado esperado
- De ~200px de altura para ~44px (sem filtros abertos)
- Visual limpo e profissional
- Mesma funcionalidade, menos ruído visual
- Mobile-first: mais espaço para os cards de jogos

