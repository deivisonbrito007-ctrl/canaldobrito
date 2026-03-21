

# Melhorias nos Cards "Ao Vivo" e "Eventos Ao Vivo"

## Problemas Identificados na Imagem

1. **Nomes de times truncados demais** — "Golden State W...", "Memphis Grizzli...", "Osasco/São Cri...", "Dentil Praia Clu..." ficam ilegíveis nos cards de 260-300px
2. **Card de Tênis sem detalhes** — Mostra apenas "ATP e WTA" sem o `competition_detail` (ex: torneio, fase)
3. **Emoji duplicado no tempo decorrido** — A linha de competição já mostra o emoji do esporte, e o indicador de tempo repete (ex: `32' 🏀`)
4. **Cards muito estreitos** para nomes longos de times brasileiros/americanos

## Correções

### 1. Aumentar largura mínima dos cards ao vivo
**`LiveNowSection.tsx` e `LiveEventsSection.tsx`**: Mudar `min-w-[260px]` para `min-w-[280px]` e `max-w-[300px]` para `max-w-[340px]` para dar mais espaço aos nomes.

### 2. Remover emoji duplicado do indicador de tempo
**`LiveNowSection.tsx` linha 95**: Trocar `{elapsed}' ${emoji}` por apenas `{elapsed}'` — o emoji já aparece na linha de competição acima.

### 3. Mostrar `competition_detail` nos cards ao vivo
**`LiveNowSection.tsx` e `LiveEventsSection.tsx`**: Adicionar subtítulo com `competition_detail` (fase, rodada, torneio) abaixo do nome do evento/times quando disponível.

### 4. Melhorar truncamento dos nomes
**`LiveNowSection.tsx`**: Nos nomes dos times, usar `text-[13px]` em vez de `text-[14px]` para caber melhor, e permitir 2 linhas com `line-clamp-2` em vez de `truncate` (1 linha).

## Arquivos
- `src/components/public/LiveNowSection.tsx`
- `src/components/public/LiveEventsSection.tsx`

