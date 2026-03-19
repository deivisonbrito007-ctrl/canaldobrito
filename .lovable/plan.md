

# Ajustar Verde do App para Combinar com a Logo

## Problema
O verde atual do app (`hsl(160, 100%, 45%)` = **#00E676**) é um verde neon muito saturado e "elétrico" que destoa do verde da logo, que é mais suave e levemente azulado/teal.

## Proposta
Ajustar o `--primary` para um verde mais próximo da logo — um **esmeralda mais equilibrado**, menos neon, com saturação ligeiramente reduzida e tom um pouco mais azulado:

| | Atual | Proposto |
|---|---|---|
| HSL | `160 100% 45%` | `158 82% 43%` |
| Hex aprox. | #00E676 | #14B87A |
| Visual | Verde neon intenso | Esmeralda sofisticado |

O novo tom fica mais "premium", menos cansativo para os olhos, e combina melhor com o tema ultra-dark do app.

## Arquivos a editar

### `src/index.css`
- Substituir todas as ocorrências de `160 100% 45%` por `158 82% 43%`
- Isso atualiza: `--primary`, `--accent`, `--ring`, `--sidebar-primary`, `--sidebar-ring`, gradientes, glows

### `tailwind.config.ts`
- Nenhuma alteração necessária (já usa CSS variables)

Total: **1 arquivo**, ~12 substituições do mesmo valor.

