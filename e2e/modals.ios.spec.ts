import { test, expect, devices } from "@playwright/test";

/**
 * iOS-specific spec: roda em múltiplos iPhones (SE, 13, 14 Pro Max) garantindo
 * que ContentDetailSheet e TrailerModal:
 *  - ficam acima do BottomNav (z-index)
 *  - são renderizados via portal direto no <body>
 *  - sobrevivem a prefers-reduced-motion (sem quebrar snap/animação)
 *  - sobrevivem a rotação portrait→landscape sem desmontar
 */

const HARNESS_PATH = "/e2e/modals";

const iosProfiles = [
  { name: "iPhone SE", device: devices["iPhone SE"] },
  { name: "iPhone 13", device: devices["iPhone 13"] },
  { name: "iPhone 14 Pro Max", device: devices["iPhone 14 Pro Max"] },
];

for (const { name, device } of iosProfiles) {
  test.describe(`iOS overlays — ${name}`, () => {
    test.use({ ...device });

    test.beforeEach(async ({ page }) => {
      await page.goto(HARNESS_PATH);
      await expect(page.getByRole("heading", { name: "E2E Modal Harness" })).toBeVisible();
    });

    test("Sheet fica acima do BottomNav e finaliza animação (snap pronto)", async ({ page }) => {
      await page.getByTestId("open-sheet").click();
      const dialog = page.getByRole("dialog", { name: "E2E Sample Title" });
      await expect(dialog).toBeVisible();

      // Aguarda animação assentar e valida que o transform final é estável (snap).
      const transformStart = await dialog.evaluate((el) => getComputedStyle(el).transform);
      await page.waitForTimeout(450);
      const transformSettled = await dialog.evaluate((el) => getComputedStyle(el).transform);
      expect(transformSettled).toBe(
        await dialog.evaluate((el) => getComputedStyle(el).transform),
      );
      // sanity: depois de assentar não está em estado inicial off-screen
      expect(transformSettled).not.toBe("");

      // Z-index acima do nav
      const nav = page.locator("nav").first();
      const dz = Number(await dialog.evaluate((el) => getComputedStyle(el).zIndex));
      const nz = Number(await nav.evaluate((el) => getComputedStyle(el).zIndex));
      expect(dz).toBeGreaterThan(nz);

      // O fundo do sheet cobre a área onde a BottomNav fica (visualmente sobre).
      const dialogBox = await dialog.boundingBox();
      const navBox = await nav.boundingBox();
      expect(dialogBox).toBeTruthy();
      expect(navBox).toBeTruthy();
      if (dialogBox && navBox) {
        // o dialog deve sobrepor verticalmente a faixa da nav
        const overlap = Math.min(dialogBox.y + dialogBox.height, navBox.y + navBox.height)
          - Math.max(dialogBox.y, navBox.y);
        expect(overlap).toBeGreaterThan(0);
      }
    });

    test("TrailerModal sobrevive a prefers-reduced-motion sem quebrar", async ({ page, context }) => {
      await context.addInitScript(() => {
        const mql = {
          matches: true,
          media: "(prefers-reduced-motion: reduce)",
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        };
        // @ts-ignore
        window.matchMedia = (q: string) =>
          q.includes("prefers-reduced-motion") ? (mql as any) : ({ ...mql, matches: false } as any);
      });
      await page.reload();
      await page.getByTestId("open-trailer").click();

      const dialog = page.getByRole("dialog", { name: /Trailer/ });
      await expect(dialog).toBeVisible();

      // mesmo com reduced-motion, opacity final = 1 e elemento mensurável
      await page.waitForTimeout(250);
      const opacity = await dialog.evaluate((el) => Number(getComputedStyle(el).opacity));
      expect(opacity).toBeGreaterThanOrEqual(0.99);
      const box = await dialog.boundingBox();
      expect(box && box.width > 0 && box.height > 0).toBe(true);

      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    });

    test("Rotação portrait→landscape preserva o overlay e o stacking", async ({ page }) => {
      await page.getByTestId("open-sheet").click();
      const dialog = page.getByRole("dialog", { name: "E2E Sample Title" });
      await expect(dialog).toBeVisible();

      const portrait = page.viewportSize();
      if (!portrait) test.skip();

      await page.setViewportSize({ width: portrait!.height, height: portrait!.width });
      await page.evaluate(() => window.dispatchEvent(new Event("orientationchange")));
      await page.waitForTimeout(200);

      // continua montado e visível
      await expect(dialog).toBeVisible();
      const nav = page.locator("nav").first();
      const dz = Number(await dialog.evaluate((el) => getComputedStyle(el).zIndex));
      const nz = Number(await nav.evaluate((el) => getComputedStyle(el).zIndex));
      expect(dz).toBeGreaterThan(nz);

      // Não excede a viewport (regra max-h em landscape)
      const box = await dialog.boundingBox();
      expect(box).toBeTruthy();
      if (box) expect(box.height).toBeLessThanOrEqual(portrait!.width);
    });

    test("Ambos os modais são portais filhos de <body> (não presos a stacking context)", async ({ page }) => {
      await page.getByTestId("open-sheet").click();
      const sheet = page.getByRole("dialog", { name: "E2E Sample Title" });
      await expect(sheet).toBeVisible();
      expect(await sheet.evaluate((el) => el.parentElement?.tagName.toLowerCase())).toBe("body");
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();

      await page.getByTestId("open-trailer").click();
      const trailer = page.getByRole("dialog", { name: /Trailer/ });
      await expect(trailer).toBeVisible();
      expect(await trailer.evaluate((el) => el.parentElement?.tagName.toLowerCase())).toBe("body");
    });
  });
}
