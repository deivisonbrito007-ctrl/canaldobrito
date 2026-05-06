## Objetivo
Adicionar uma spec E2E **iOS-only** (WebKit em iPhone SE / 13 / 14 Pro Max, com `hasTouch`) garantindo que o **tap no backdrop** fecha **apenas o modal alvo** quando há um único modal aberto e, no cenário empilhado (sheet + trailer), fecha somente o modal de cima.

Esses cenários complementam `e2e/modals.spec.ts` (mouse desktop) e `e2e/modals.ios.spec.ts` (snap/rotação) — nenhum deles cobre tap real iOS no backdrop com a granularidade pedida.

## Arquivo a criar

`e2e/modals.ios-backdrop.spec.ts`

Estrutura:

```text
for each iOS profile (SE, 13, 14 Pro Max) {
  describe("iOS backdrop tap — only correct modal closes") {
    beforeEach: goto /e2e/modals; aguarda harness
    test 1: tap backdrop com SÓ o sheet aberto -> sheet fecha; nav permanece
    test 2: tap backdrop com SÓ o trailer aberto -> trailer fecha
    test 3: tap DENTRO do conteúdo do sheet (poster/heading) -> NÃO fecha
    test 4: tap DENTRO do iframe/área do trailer -> NÃO fecha
    test 5: empilhados (sheet + trailer) — tap no backdrop do trailer fecha
            APENAS o trailer; sheet continua visível e travando body scroll
    test 6: depois de (5), tap no backdrop do sheet fecha o sheet;
            body.overflow restaurado
  }
}
```

## Detalhes técnicos
- `test.use({ ...devices["iPhone X"] })` por bloco, com `hasTouch: true` herdado.
- Usar `page.touchscreen.tap(x, y)` (gesto real iOS) para o backdrop, em vez de `page.mouse.click`.
- Backdrop do trailer: primeiro `.fixed.inset-0.bg-black\\/85`. Backdrop do sheet: `.fixed.inset-0.bg-black\\/60`. Coordenadas calculadas a partir do `boundingBox()` do backdrop, garantindo área **fora** do `pointer-events-auto` interno.
- Validar não-fechamento via `await expect(dialog).toBeVisible()` após 300ms.
- Validar `document.body.style.overflow === "hidden"` enquanto qualquer modal estiver aberto e `=== ""` ao fim.
- Reaproveitar `data-testid="open-sheet"` / `open-trailer"` já presentes em `src/pages/E2EModals.tsx`.

## CI
A spec entra automaticamente nos jobs existentes:
- `e2e` matriz (perfil "iPhone 13 (WebKit)")
- `playwright.ci.config.ts` já registra os perfis iOS.

Sem mudanças em `.github/workflows/ci.yml`.

## Critérios de aceite
- 6 testes × 3 perfis = 18 execuções, todas verdes localmente e no CI.
- Em nenhum cenário o tap no backdrop fecha o modal errado.
- Sheet sob o trailer permanece com foco preso e body lock ativo até seu próprio fechamento.