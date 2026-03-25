

## Seção "Jogos ao Vivo Agora" — Destaque Visual Unificado

### Situação Atual
O app já possui duas seções ao vivo separadas: `LiveFeedSection` (partidas adversariais) e `LiveEventsSection` (eventos individuais). Ambas funcionam bem mas são visualmente discretas.

### Proposta
Criar uma nova seção unificada `LiveNowHero` que substitui as duas seções existentes, com destaque visual premium: fundo gradiente pulsante, contador animado, e cards maiores com mais impacto.

### O que muda

**1. Nova seção `LiveNowHero`**
- Fundo gradiente escuro com borda vermelha pulsante quando há jogos ao vivo
- Header com ícone animado, título "AO VIVO AGORA", contador de jogos e relógio
- Carrossel horizontal de cards grandes (min-w 300px) para jogos adversariais
- Grid compacto abaixo para eventos não-adversariais
- Auto-atualização a cada 60s (tick pattern existente)
- Seção desaparece automaticamente quando não há nada ao vivo

**2. Cards com destaque visual**
- Barra lateral colorida por esporte (vermelho futebol, azul basquete, etc.)
- Dot pulsante vermelho + minutos decorridos em destaque
- Nome dos times em fonte maior (15px)
- Badge do canal com mais destaque
- Animação de entrada escalonada (stagger)

**3. Substituição no Index.tsx**
- Remover `LiveFeedSection` e `LiveEventsSection` do home
- Inserir `LiveNowHero` no mesmo local
- Manter os componentes antigos no código (usados na aba Schedule)

### Arquivos Afetados
| Arquivo | Ação |
|---------|------|
| `src/components/public/LiveNowHero.tsx` | Criar — seção unificada |
| `src/pages/Index.tsx` | Substituir imports das duas seções pela nova |

