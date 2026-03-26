

## Centralizar conteúdo dos cards "Ao Vivo"

### Situação atual
Os nomes dos times estão alinhados à esquerda (`text-left` implícito), enquanto o "VS" já está centralizado. Isso cria uma inconsistência visual — o card fica desbalanceado.

### Proposta
Centralizar todo o bloco de conteúdo principal do card (nomes dos times + VS), criando um visual mais limpo e equilibrado, similar a apps de esportes como ESPN e SofaScore.

### Alterações em `src/components/public/LiveNowHero.tsx`

**MatchCard — centralizar nomes dos times:**
- Adicionar `text-center` ao container dos nomes (linha 94, `div.space-y-0.5`)
- Os nomes dos times (linhas 95-96 e 99-100) herdam o alinhamento centralizado
- O "VS" já está centralizado — fica consistente
- O badge "Feminino" já está centralizado — fica consistente

**MatchCard — centralizar o header (liga + ao vivo):**
- Manter o header (liga + indicador AO VIVO) com `justify-between` — esse precisa ficar separado para legibilidade

**MatchCard — centralizar o footer (horário + canal):**
- Manter `justify-between` no footer — horário à esquerda e canal à direita faz sentido funcional

**EventCard — centralizar nome do evento:**
- Adicionar `text-center` ao nome do evento (linha ~156) para manter consistência visual com os MatchCards

### Resumo das mudanças
- Linha 94: adicionar `text-center` ao `div` dos times
- Linha ~156 (EventCard): adicionar `text-center` ao nome do evento

Resultado: cards com visual centralizado, equilibrado e mais profissional.

