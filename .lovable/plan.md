## Objetivo
Adicionar uma spec E2E **iOS-only** garantindo que, ao abrir o Trailer com o Sheet já aberto, o **z-index, foco e stacking** ficam corretos e nada quebra.

Complementa:
- `e2e/modals.ios.spec.ts` (snap/rotação)
- `e2e/modals.ios-backdrop.spec.ts` (tap no backdrop)
- `e2e/modals.spec.ts` (mouse desktop, sem hit-test stacking)

## Arquivo a criar
`e2e/modals.ios-stacking.spec.ts`

Loop em 3 perfis WebKit (`iPhone SE`, `iPhone 13`, `iPhone 14 Pro Max`).

### Cenário principal (1 teste)
1. Abre o sheet, espera animação assentar.
2. Captura `sheetZ` e `navZ` — espera `sheetZ > navZ`.
3. Abre o trailer **sem fechar** o sheet.
4. Verifica:
   - `trailerZ ≥ sheetZ` e `trailerZ > navZ`.
   - Ordem no DOM: o `[role="dialog"]` do trailer aparece **depois** do sheet.
   - Sheet continua `attached` e `visible` (não desmontou).
   - `document.activeElement` está **dentro do trailer**.
   - `document.body.style.overflow === "hidden"`.
   - **Hit-test**: `document.elementFromPoint(centro do trailer)` resolve para um `[role="dialog"]` cujo `aria-label` contém `Trailer`.
5. ESC fecha **apenas** o trailer; sheet permanece visível e o foco volta para dentro do sheet; body continua travado.
6. ESC novamente fecha o sheet; `body.overflow === ""`.

### Cenário extra (1 teste)
- Abrir sheet → abrir trailer → ESC: confirma que ESC fecha **somente** o trailer (sheet permanece). Garante que o handler do trailer captura o ESC primeiro.

## Detalhes técnicos
- `test.use({ ...devices["iPhone X"] })` por bloco (WebKit + hasTouch).
- Helper `zIndex(page, locator)` via `getComputedStyle(el).zIndex`.
- Reutiliza `data-testid="open-sheet"` e `open-trailer` do harness `src/pages/E2EModals.tsx`.
- Sem alterações em `playwright.ci.config.ts` ou `.github/workflows/ci.yml` — a spec entra automaticamente nos jobs `e2e` (perfil iPhone 13 WebKit).

## Critérios de aceite
- 2 testes × 3 perfis iOS = 6 execuções verdes localmente e no CI.
- Trailer sempre acima do sheet (z-index e hit-test).
- Foco rastreado corretamente: trailer ao abrir, sheet ao fechar trailer.
- Body scroll lock permanece até o último modal fechar.