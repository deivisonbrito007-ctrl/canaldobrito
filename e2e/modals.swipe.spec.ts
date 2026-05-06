import { test, expect, devices } from "@playwright/test";

/**
 * Touch swipe behavior for ContentDetailSheet.
 * Runs em iPhone (hasTouch=true) para simular interações reais de gesto.
 *
 * Cobertura:
 *  - swipe curto (<120px) NÃO fecha (volta ao snap)
 *  - swipe longo (>120px) fecha
 *  - flick rápido (alta velocidade, mesmo curto) fecha
 *  - swipe para CIMA não move o sheet (dragConstraints top:0)
 *  - swipe iniciado FORA do drag handle (na área de scroll) não fecha
 *  - drag elastic respeita limite (não vai além de ~60% do offset)
 */

const HARNESS_PATH = "/e2e/modals";

test.use({ ...devices["iPhone 13"] });

test.describe("ContentDetailSheet — swipe/drag (touch)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS_PATH);
    await expect(page.getByRole("heading", { name: "E2E Modal Harness" })).toBeVisible();
    await page.getByTestId("open-sheet").click();
    await expect(page.getByRole("dialog", { name: "E2E Sample Title" })).toBeVisible();
    // Aguarda animação de entrada estabilizar
    await page.waitForTimeout(450);
  });

  const handleBox = async (page: import("@playwright/test").Page) => {
    const dialog = page.getByRole("dialog", { name: "E2E Sample Title" });
    const handle = dialog.locator("div.cursor-grab").first();
    const box = await handle.boundingBox();
    if (!box) throw new Error("drag handle não encontrado");
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };

  const swipe = async (
    page: import("@playwright/test").Page,
    fromX: number,
    fromY: number,
    deltaY: number,
    steps = 10,
    stepDelayMs = 16,
  ) => {
    await page.touchscreen.tap(fromX, fromY); // garante foco/touch start
    // Use evaluate para emitir TouchEvents reais (Playwright touchscreen.swipe não existe)
    await page.evaluate(
      ({ fromX, fromY, deltaY, steps, stepDelayMs }) => {
        const target = document.elementFromPoint(fromX, fromY) as HTMLElement;
        if (!target) return;
        const makeTouch = (x: number, y: number) =>
          new Touch({ identifier: 1, target, clientX: x, clientY: y, pageX: x, pageY: y });
        const dispatch = (type: string, x: number, y: number) => {
          const t = makeTouch(x, y);
          target.dispatchEvent(
            new TouchEvent(type, {
              bubbles: true,
              cancelable: true,
              touches: type === "touchend" ? [] : [t],
              targetTouches: type === "touchend" ? [] : [t],
              changedTouches: [t],
            }),
          );
        };
        return new Promise<void>((resolve) => {
          dispatch("touchstart", fromX, fromY);
          let i = 0;
          const tick = () => {
            i += 1;
            const y = fromY + (deltaY * i) / steps;
            dispatch("touchmove", fromX, y);
            if (i < steps) setTimeout(tick, stepDelayMs);
            else {
              dispatch("touchend", fromX, fromY + deltaY);
              resolve();
            }
          };
          setTimeout(tick, stepDelayMs);
        });
      },
      { fromX, fromY, deltaY, steps, stepDelayMs },
    );
  };

  test("swipe curto (<120px) volta ao snap e NÃO fecha", async ({ page }) => {
    const dialog = page.getByRole("dialog", { name: "E2E Sample Title" });
    const { x, y } = await handleBox(page);
    await swipe(page, x, y, 80, 8, 20);
    await page.waitForTimeout(500);
    await expect(dialog).toBeVisible();
    // snap de volta: y final deve estar próximo de 0
    const transform = await dialog.evaluate((el) => getComputedStyle(el).transform);
    // matrix(...) — extrai translateY (último valor)
    const ty = transform === "none" ? 0 : Number(transform.split(",").pop()?.replace(")", "") ?? 0);
    expect(Math.abs(ty)).toBeLessThan(5);
  });

  test("swipe longo (>120px) fecha o sheet", async ({ page }) => {
    const dialog = page.getByRole("dialog", { name: "E2E Sample Title" });
    const { x, y } = await handleBox(page);
    await swipe(page, x, y, 260, 12, 16);
    await expect(dialog).toBeHidden({ timeout: 2000 });
  });

  test("flick rápido fecha mesmo com offset moderado (velocidade > 500px/s)", async ({ page }) => {
    const dialog = page.getByRole("dialog", { name: "E2E Sample Title" });
    const { x, y } = await handleBox(page);
    // 90px em ~80ms ≈ 1100px/s, abaixo do threshold de offset mas acima do de velocidade
    await swipe(page, x, y, 90, 4, 20);
    await expect(dialog).toBeHidden({ timeout: 2000 });
  });

  test("swipe para CIMA é limitado por dragConstraints (top:0)", async ({ page }) => {
    const dialog = page.getByRole("dialog", { name: "E2E Sample Title" });
    const { x, y } = await handleBox(page);
    await swipe(page, x, y, -200, 10, 16);
    await page.waitForTimeout(400);
    await expect(dialog).toBeVisible();
    const transform = await dialog.evaluate((el) => getComputedStyle(el).transform);
    const ty = transform === "none" ? 0 : Number(transform.split(",").pop()?.replace(")", "") ?? 0);
    // Sem elasticidade no topo: ty deve ser ~0
    expect(ty).toBeGreaterThanOrEqual(-2);
    expect(ty).toBeLessThan(5);
  });

  test("swipe iniciado FORA do handle (área scrollável) NÃO fecha o sheet", async ({ page }) => {
    const dialog = page.getByRole("dialog", { name: "E2E Sample Title" });
    // Pega um ponto dentro da área de scroll (heading do conteúdo)
    const heading = dialog.locator("h3", { hasText: "E2E Sample Title" });
    const box = await heading.boundingBox();
    if (!box) throw new Error("heading não encontrado");
    const fromX = box.x + box.width / 2;
    const fromY = box.y + box.height / 2;
    await swipe(page, fromX, fromY, 260, 12, 16);
    await page.waitForTimeout(500);
    await expect(dialog).toBeVisible();
  });

  test("drag elastic respeita limite ~60% (não desce arbitrariamente)", async ({ page }) => {
    const dialog = page.getByRole("dialog", { name: "E2E Sample Title" });
    const { x, y } = await handleBox(page);

    // Drag muito longo, mas SEM soltar — mede o offset durante o gesto
    await page.evaluate(
      ({ x, y }) => {
        const target = document.elementFromPoint(x, y) as HTMLElement;
        if (!target) return;
        const t = (cx: number, cy: number) =>
          new Touch({ identifier: 1, target, clientX: cx, clientY: cy, pageX: cx, pageY: cy });
        const fire = (type: string, cx: number, cy: number) => {
          const tch = t(cx, cy);
          target.dispatchEvent(
            new TouchEvent(type, {
              bubbles: true,
              cancelable: true,
              touches: type === "touchend" ? [] : [tch],
              targetTouches: type === "touchend" ? [] : [tch],
              changedTouches: [tch],
            }),
          );
        };
        fire("touchstart", x, y);
        for (let i = 1; i <= 20; i++) fire("touchmove", x, y + i * 50); // 1000px tentativa
      },
      { x, y },
    );
    await page.waitForTimeout(150);
    const transform = await dialog.evaluate((el) => getComputedStyle(el).transform);
    const ty = transform === "none" ? 0 : Number(transform.split(",").pop()?.replace(")", "") ?? 0);
    // Com dragElastic.bottom=0.6, offset real <= ~600px (60% de 1000)
    expect(ty).toBeLessThanOrEqual(650);
    expect(ty).toBeGreaterThan(0);

    // Solta sem disparar fechamento (offset > 120 -> fecharia; o objetivo aqui é só o limite elástico).
    await page.evaluate(({ x, y }) => {
      const target = document.elementFromPoint(x, y) as HTMLElement;
      const t = new Touch({ identifier: 1, target, clientX: x, clientY: y, pageX: x, pageY: y });
      target.dispatchEvent(
        new TouchEvent("touchend", {
          bubbles: true,
          cancelable: true,
          touches: [],
          targetTouches: [],
          changedTouches: [t],
        }),
      );
    }, { x, y: y + 1000 });
  });
});
