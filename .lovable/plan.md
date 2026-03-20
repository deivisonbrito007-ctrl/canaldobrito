

# Correção dos Cards Cortados na Aba Programação

## Problema

Os cards de jogos estão sendo cortados no lado direito — os nomes dos times visitantes ("Cruzeiro...", "Memphis Grizzli...", "Gimnasia La Pla...") aparecem cortados na borda da tela sem elipse, indicando que o container do card ultrapassa a largura do viewport.

## Causa Raiz

A `<section>` em `DailyGamesSection` não tem restrição de largura (`w-full min-w-0`) nem `overflow-hidden`. Em telas estreitas (320-384px), conteúdo como badges longos ou o bloco central de horário pode empurrar o card além do viewport. A cascata `overflow-x-hidden` do `Index.tsx` esconde a scrollbar mas simplesmente corta o conteúdo.

## Correções

### 1. Adicionar constraints de largura no container da seção
- **`DailyGamesSection.tsx`**: Na `<section>` principal (linha 382), adicionar `w-full min-w-0 overflow-hidden` para que o container nunca ultrapasse o viewport e force os filhos a respeitar limites.

### 2. Garantir overflow-hidden nos cards individuais
- **`DailyGamesSection.tsx`**: No card wrapper `motion.div` (linha ~147), adicionar `min-w-0` para que o grid item não expanda além do container.

### 3. Reduzir o bloco central de horário no mobile
- O bloco de horário (`px-2.5 py-1.5`) com ícone Clock + texto ocupa ~100px fixos. Reduzir para `px-2 py-1` e o ícone para `h-3 w-3` no mobile, liberando mais espaço para os nomes dos times.

### 4. Sugestão: Competition badge mais inteligente
- Em vez de `max-w-[160px]` fixo, usar `max-w-[45vw]` para se adaptar proporcionalmente à tela, evitando truncamento excessivo em telas maiores e overflow em telas menores.

## Arquivos
- `src/components/public/DailyGamesSection.tsx` — constraints de largura, overflow, e ajustes de tamanho

