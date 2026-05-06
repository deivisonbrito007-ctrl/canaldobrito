## Objetivo

Transformar os dois headers de "próximos eventos" em banners premium com identidade visual forte, sem aumentar custo cognitivo. Hoje:
- **Programação → "Amanhã"** (`TomorrowSection.tsx`): texto pequeno, cinza, fácil de perder.
- **Ao Vivo → "Começam em breve"** (`LivePageContent.tsx`): título simples + chip pequeno, sem destaque.

## Plano

### 1. Banner premium "Começam em breve" (Ao Vivo)
Substituir o header simples por um banner com:
- Container `rounded-2xl` com gradiente `from-primary/15 via-primary/5 to-transparent`, borda `primary/30`, blur orb decorativo no canto, e linha de accent no topo.
- Ícone `Trophy` em quadrado 40px com glow (`shadow-[0_0_16px_hsl(var(--primary)/0.25)]`).
- Título uppercase tracking-wide + chip de contagem com glow `bg-primary text-primary-foreground`.
- Subtítulo informativo dinâmico: **"Próximo em Xmin · N eventos na próxima hora"** (usa `upcoming[0].diffMin`).
- Próximo evento (`upcoming[0]`) recebe um destaque sutil: borda primary mais forte e badge "PRÓXIMO" no `UpcomingCard` quando `index === 0`.

### 2. Banner premium "Amanhã" (Programação)
Reescrever o `CollapsibleTrigger` em `TomorrowSection.tsx`:
- Card `rounded-2xl` com gradiente `from-accent/10 via-accent/5 to-transparent` (usa o verde do tema), borda `accent/25`, glow orb azulado.
- Ícone `CalendarClock` (lucide) em quadrado 40px com tinta accent.
- Linha 1: título "Amanhã" uppercase + chip de contagem com glow accent + chip de data formatada ("Qui, 7 mai").
- Linha 2: stats compactas — "🌅 N · ☀️ N · 🌙 N" (manhã / tarde / noite) calculadas a partir de `grouped`.
- Chevron animado à direita, ainda atua como toggle (mantém o `min-h-[44px]` para acessibilidade mobile).
- Quando aberto, manter o `space-y-5` atual dentro do `CollapsibleContent`.

### 3. Polimentos compartilhados
- Respeitar `motion-safe:` para o glow pulsante (não animar com `prefers-reduced-motion`).
- Garantir contraste AA do texto secundário (`text-foreground/70` no lugar de `text-muted-foreground/50`).
- Manter aria-labels descritivos: `aria-label="Mostrar jogos de amanhã, N jogos"` no trigger do colapsável.

## Sugestões adicionais (peço aprovação antes de aplicar)

1. **Mini-progresso temporal**: barra horizontal fina sob o banner "Começam em breve" mostrando posição do próximo evento na janela de 60 min (`diffMin / 60`).
2. **Sticky header ao rolar**: o banner "Começam em breve" gruda no topo enquanto o usuário rola pelos cards live.
3. **Botão "Ver tudo"** no banner Amanhã que abre direto a aba Programação no dia seguinte (evita o duplo clique de expandir + navegar).
4. **Ícone do esporte mais próximo**: substituir o `Trophy` pelo emoji do esporte de `upcoming[0]` para reforçar contexto ("⚽ Começa em 7min").

## Arquivos afetados

- `src/components/public/LivePageContent.tsx` (banner "Começam em breve" + destaque do primeiro `UpcomingCard`).
- `src/components/public/schedule/TomorrowSection.tsx` (banner "Amanhã" com stats por período).
- Sem alterações em testes (apenas visuais); rodar `bunx vitest run` para garantir 274/274.
