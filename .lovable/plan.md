## Corrigir logo do BandSports + padronização

### Mudanças

**1. Adicionar logo correta do BandSports**
- Copiar `user-uploads://Screenshot_20260507_014357_Chrome.jpg` para `src/assets/brand-logos/bandsports.png`.
- Importar via Vite em `ChannelBadge.tsx` como `bandsportsLogo`.
- Atualizar mapeamento `bandsports` para usar `bandsportsLogo` (em vez de reaproveitar `bandLogo`).

**2. Padronização das logos (continuação)**
- Remover `bg-white/95` do wrapper → fundo sempre transparente.
- Remover flag `darkBg` (não faz mais sentido sem branco padrão).
- Wrapper unificado quadrado: `sm h-5 w-5`, `md h-7 w-7`, `lg h-9 w-9` — `object-contain` mantém logos largas proporcionais.
- Para logos com fundo claro/transparente que ficam ilegíveis no tema dark (Globo preta, Record, Premiere): aplicar leve `bg-white/10 rounded` via flag `lightChip: true`.

**3. Limpeza de mapeamentos errados**
- `Canal do Benja` → remover `localLogo: youtubeLogo` (não é YouTube oficial), volta para emoji 🎙️.
- `BandPlay` e `Esporte na Band` → mantém `bandLogo` (mesma marca-mãe correta).

### Arquivo editado
- `src/components/public/ChannelBadge.tsx` — novo import, mapping atualizado, wrapper sem fundo branco, tamanho quadrado unificado.
- Novo asset: `src/assets/brand-logos/bandsports.png`.

### Sugestão
Se você tiver as logos oficiais (PNG transparente em alta) de **BandPlay**, **Esporte na Band**, **Canal do Benja**, **NSports**, **SBT**, **Combate**, **OneFootball**, **NBA League Pass**, **TV Aratu** e **TV Jornal**, me envie em lote — substituo todas de uma vez e o app fica 100% com identidade oficial. Por enquanto vou usar emoji nos canais sem PNG bom (mais limpo que placeholder genérico).
