

# Separar "Ao Vivo" em Jogos e Eventos

## Ideia

Concordo — faz sentido separar. A seção atual mistura futebol (Time A x Time B) com eventos como F1/MotoGP que não têm adversários. A sugestão:

1. **"Ao Vivo" fica dedicada a jogos adversariais** (futebol, basquete, vôlei, tênis, MMA) — mantém o layout atual com `Time A X Time B`
2. **Nova seção "Eventos Ao Vivo"** para esportes não-adversariais (F1, MotoGP, Stock Car) — layout centralizado, visual diferenciado (accent amarelo/laranja em vez de vermelho, ícone de bandeira quadriculada)

### Layout visual

```text
┌─────────────────────────────────────────┐
│ ⚡ Ao Vivo Canal do Brito    [2 ao vivo]│
│ ┌──────────┐ ┌──────────┐              │
│ │ Time A   │ │ Time C   │              │
│ │   X      │ │   X      │              │
│ │ Time B   │ │ Time D   │              │
│ └──────────┘ └──────────┘              │
├─────────────────────────────────────────┤
│ 🏁 Eventos Ao Vivo          [1 ao vivo]│
│ ┌──────────────────────┐               │
│ │ 🏎️ Moto3 — GP Brasil │               │
│ │     AO VIVO          │               │
│ └──────────────────────┘               │
└─────────────────────────────────────────┘
```

### Comportamento
- Cada seção só aparece quando tem itens ao vivo naquela categoria
- Se nenhum jogo adversarial ao vivo → mostra empty state "Nenhum jogo ao vivo"
- Se nenhum evento ao vivo → seção de eventos simplesmente não aparece (sem empty state, para não poluir)
- Se não há nada ao vivo em nenhuma → mostra apenas o empty state de jogos

### Arquivos

- **`src/components/public/LiveNowSection.tsx`** — filtrar apenas jogos adversariais (`!isNonAdversarial`), manter design atual
- **`src/components/public/LiveEventsSection.tsx`** — novo componente para eventos não-adversariais, accent laranja/âmbar, ícone `Flag` ou `Trophy`
- **`src/pages/Index.tsx`** — adicionar `LiveEventsSection` logo abaixo de `LiveNowSection`

