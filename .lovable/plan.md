## Otimizações Mobile — Aba Ao Vivo

Mudanças focadas no viewport 320–430px, sem alterar funcionalidade.

### 1. Hero header compacto
- Reduzir padding vertical do hero (`p-4` → `p-3`) e o título de `text-2xl` → `text-xl` no mobile
- Mover o **relógio + badge "Atualizado"** para uma única linha horizontal abaixo do título quando não houver jogos (libera ~40px verticais)
- Quando `liveGames.length === 0`, esconder a contagem grande "0 jogos agora" e mostrar apenas o badge AO VIVO + relógio compacto

### 2. Filtros com indicador de scroll
- Adicionar **fade gradient direito** (`mask-image`) na faixa de filtros para sinalizar que há mais conteúdo lateral
- Reduzir padding dos pills (`px-3 py-2` → `px-2.5 py-1.5`) e ocultar o emoji em telas <360px (mantém só label + count)
- Ordenar filtros por relevância: esconder filtros com `count === 0` (exceto "Todos")

### 3. Empty state slim
- Reduzir o cartão de empty state de `p-6` → `p-4`, ícone `w-14` → `w-11`
- Remover a margem horizontal (`mx-3` → ocupar full width com padding interno)
- Texto explicativo em uma única linha curta

### 4. Card "Começam em breve" otimizado
- Badge "EM 33m" mais estreito: `min-w-[44px]` → `min-w-[38px]`, fonte `text-sm` → `text-[13px]`
- Liga + competição em **uma linha só** com truncate (ex: "COPA SUL-AMERICANA · GRUPO B")
- Times com `line-clamp-1` para evitar quebra
- Hora à direita em formato menor (`text-[10px]` → `text-[9px]`) para dar mais espaço ao nome

### 5. Padding lateral consistente
- Padronizar `px-3` em todas seções (hero, listas, cards) usando wrapper único
- Ajustar safe-area-inset-bottom no fim da página (`pb-4` → `pb-[calc(1rem+env(safe-area-inset-bottom))]`)

### 6. Pequenos ajustes UX
- Touch target dos filtros garantido em ≥40px (já está, validar)
- Adicionar `aria-live="polite"` na contagem de jogos para leitores de tela
- Animação `animate-pulse` no border do hero respeita `prefers-reduced-motion`

### Arquivos afetados
- `src/components/public/LivePageContent.tsx` (único arquivo)

### Não-objetivos
- Não mexer em lógica de filtros, fetch ou no `ChannelBadge` (já otimizados)
- Não adicionar novas seções ou abas
