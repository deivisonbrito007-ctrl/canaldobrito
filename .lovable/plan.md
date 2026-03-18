

# Melhorar Programação Ao Vivo — Plano Revisado

## Mudanças em `src/components/public/LiveNowSection.tsx`

### 1. Filtro inteligente com margem para prorrogação e pênaltis
- Aumentar janela de visibilidade de 105min para **150 minutos** (cobre 90min regulamentares + 30min prorrogação + 30min pênaltis/intervalos)
- Jogos com `is_live: true` no banco aparecem **sempre**, independente do tempo calculado — isso permite que a edge function force a exibição via API-Football
- Apenas jogos sem flag `is_live` usam o cálculo de tempo local como fallback

```
Lógica: isGameLive = is_live === true OU (agora >= início E agora <= início + 150min)
```

### 2. Indicador de fase do jogo
Em vez de só mostrar o minuto, mostrar a fase atual:
- `0'-45'` → minuto normal (1º tempo)
- `45'-60'` → **INT** (intervalo)
- `60'-105'` → minuto ajustado (2º tempo)
- `105'-120'` → **PROR** (prorrogação 1º tempo extra)
- `120'-135'` → **PROR** (prorrogação 2º tempo extra)
- `135'+` → **PEN** (pênaltis)

Isso deixa claro para o visitante em que fase o jogo está.

### 3. Canais mais visíveis
- Badges: `bg-primary/20 text-primary font-semibold text-[10px]`
- Ícone `Tv` ao lado
- Mostrar todos os canais (sem `.slice(0,2)`)

### 4. Separador visual e detalhes
- Linha sutil entre times e info dos canais
- `competition_detail` com cor mais clara

## Resultado
- Jogos com prorrogação/pênaltis continuam visíveis até ~150min
- Jogos marcados como `is_live` pela API nunca somem prematuramente
- Visitante vê claramente a fase (INT, PROR, PEN)
- Canais em destaque verde

