## Objetivo

Aplicar todos os logos PNG oficiais enviados na página `/assinar`, incluindo o novo **ESPN** e o rebrand **HBO Max → Max**.

## Logos a salvar em `src/assets/brand-logos/`

**Lote 1 (10):** `goat.png`, `paramountplus.png`, `youtube.png`, `record.png`, `sportv.png`, `cazetv.png`, `space.png`, `max.png`, `dazn.png`, `tntsports.png`

**Lote 2 (7):** `disneyplus.png`, `premiere.png`, `netflix.png`, `primevideo.png`, `globo.png`, `band.png`, `globoplay.png`

**Lote 3 (1):** `image-76.png` → `espn.png`

## Rebrand HBO Max → Max

- Remover entrada "HBO Max" da lista do marquee, deixando apenas "Max" usando `max.png` (sem duplicar).
- Apagar o asset antigo `src/assets/brand-logos/hbomax.svg`.

## Em `src/pages/Assinar.tsx`

- Trocar os 18 imports `.svg` correspondentes por `.png`.
- Manter dimensões e estilo do tile (`w-16 h-16 sm:w-[72px]`, `rounded-2xl`, `object-cover`).

## Ainda faltando logos oficiais

Apple TV+ e Starz — continuam com os SVGs atuais até você enviar.

Pode aprovar que aplico tudo de uma vez.