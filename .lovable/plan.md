

# Refinar Visual da Marca -- Profissionalizar Logo, Cores e Tipografia

## Problemas Identificados

1. **Logo com aparência amadora**: o `rounded-xl` cria bordas arredondadas que não combinam com logo sem fundo; o `glow-primary-subtle` adiciona um brilho esverdeado que destoa
2. **Cor do nome não combina com a logo**: o gradiente `text-gradient-primary` (verde→ciano) não reflete as cores reais da logo
3. **Tipografia do nome**: `font-display` (Bebas Neue) com `tracking-[2px]` em caixa alta fica espaçado demais e genérico
4. **SectionHeader**: texto "Brito Solutions" em verde puro (`text-primary`) destoa do restante da identidade

## Plano

### 1. Navbar (`AppNavbar.tsx`)
- **Logo**: remover `rounded-xl` e `glow-primary-subtle` -- deixar a logo limpa sem moldura nem brilho, apenas `h-10 w-auto object-contain`
- **Nome**: trocar de `font-display text-xl tracking-[2px] text-gradient-primary` em caixa alta para `font-body text-lg font-bold text-foreground` com "Brito" em branco e "Solutions" usando `text-primary` (verde sólido, sem gradiente), ou usar o gradiente apenas em "Solutions"
- **Resultado**: visual limpo, profissional, nome legível

### 2. Footer (`PublicFooter.tsx`)
- **Logo**: remover `glow-primary-subtle`, manter `h-12 w-auto`
- **Nome**: mesmo padrão do navbar -- "Brito" branco + "Solutions" em `text-primary`, `font-body font-bold text-lg`

### 3. SectionHeader (`SectionHeader.tsx`)
- Trocar `<span className="text-primary">Brito Solutions</span>` por `<span className="text-foreground/70">Brito Solutions</span>` -- mais sutil e profissional, não compete com o título da seção
- Alternativa: usar `text-primary/70` para manter a cor mas menos gritante

### 4. Gradiente CSS (`index.css`)
- Atualizar `.text-gradient-primary` para um gradiente branco→verde mais refinado: `linear-gradient(135deg, hsl(0 0% 95%), hsl(160 100% 45%))` -- isso faz "BRITO" parecer branco e "SOLUTIONS" verde, combinando com a logo

## Arquivos a editar
- `src/components/public/AppNavbar.tsx`
- `src/components/public/PublicFooter.tsx`
- `src/components/public/SectionHeader.tsx`
- `src/index.css`

