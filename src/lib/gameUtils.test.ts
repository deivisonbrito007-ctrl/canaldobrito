import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isGameCurrentlyLive, getLocalDateString, getElapsedMinutes, detectSportType } from "./gameUtils";

describe("getLocalDateString", () => {
  it("returns YYYY-MM-DD format", () => {
    const result = getLocalDateString(new Date(2026, 2, 19));
    expect(result).toBe("2026-03-19");
  });

  it("pads single-digit month and day", () => {
    const result = getLocalDateString(new Date(2026, 0, 5));
    expect(result).toBe("2026-01-05");
  });

  it("uses current date when no arg", () => {
    const result = getLocalDateString();
    const now = new Date();
    expect(result).toBe(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    );
  });
});

describe("detectSportType", () => {
  it("detects basketball", () => {
    expect(detectSportType("NBA")).toBe("basketball");
    expect(detectSportType("NBB")).toBe("basketball");
    expect(detectSportType("EuroLeague")).toBe("basketball");
  });

  it("detects tennis", () => {
    expect(detectSportType("ATP Finals")).toBe("tennis");
    expect(detectSportType("Roland Garros")).toBe("tennis");
    expect(detectSportType("WTA 1000")).toBe("tennis");
  });

  it("detects f1", () => {
    expect(detectSportType("Fórmula 1")).toBe("f1");
    expect(detectSportType("F1 GP")).toBe("f1");
    expect(detectSportType("Grande Prêmio")).toBe("f1");
    expect(detectSportType("Automobilismo")).toBe("f1");
    expect(detectSportType("MotoGP")).toBe("f1");
    expect(detectSportType("Moto2")).toBe("f1");
    expect(detectSportType("Moto3")).toBe("f1");
    expect(detectSportType("Formula E")).toBe("f1");
    expect(detectSportType("Formula-e")).toBe("f1");
    expect(detectSportType("Stock Car")).toBe("f1");
    expect(detectSportType("IndyCar")).toBe("f1");
    expect(detectSportType("E-Prix de São Paulo")).toBe("f1");
    expect(detectSportType("GP do Brasil")).toBe("f1");
  });

  it("detects mma", () => {
    expect(detectSportType("UFC 300")).toBe("mma");
    expect(detectSportType("Bellator")).toBe("mma");
  });

  it("detects volleyball", () => {
    expect(detectSportType("Superliga")).toBe("volleyball");
    expect(detectSportType("Vôlei")).toBe("volleyball");
  });

  it("defaults to football", () => {
    expect(detectSportType("Brasileirão")).toBe("football");
    expect(detectSportType("Champions League")).toBe("football");
    expect(detectSportType("La Liga")).toBe("football");
  });
});

describe("isGameCurrentlyLive", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("returns true within 90min for football", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 15, 30));
    expect(isGameCurrentlyLive("15:00", "2026-03-19", "football")).toBe(true);
  });

  it("returns false after football duration+buffer (120min)", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 17, 0)); // 120min after 15:00
    expect(isGameCurrentlyLive("15:00", "2026-03-19", "football")).toBe(false);
  });

  it("returns false after basketball duration+buffer (165min)", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 17, 45)); // 165min after 15:00
    expect(isGameCurrentlyLive("15:00", "2026-03-19", "basketball")).toBe(false);
  });

  it("returns true within 48min for basketball", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 15, 47));
    expect(isGameCurrentlyLive("15:00", "2026-03-19", "basketball")).toBe(true);
  });

  it("returns true within 180min for tennis", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 17, 59));
    expect(isGameCurrentlyLive("15:00", "2026-03-19", "tennis")).toBe(true);
  });

  it("returns false after tennis duration+buffer (225min)", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 18, 45)); // 225min after 15:00
    expect(isGameCurrentlyLive("15:00", "2026-03-19", "tennis")).toBe(false);
  });

  it("returns true within 180min for mma", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 17, 59));
    expect(isGameCurrentlyLive("15:00", "2026-03-19", "mma")).toBe(true);
  });

  it("returns false after 195min (180+buffer) for mma", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 18, 15));
    expect(isGameCurrentlyLive("15:00", "2026-03-19", "mma")).toBe(false);
  });

  it("returns true within 120min for f1", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 16, 59));
    expect(isGameCurrentlyLive("15:00", "2026-03-19", "f1")).toBe(true);
  });

  it("defaults to football when no sportType", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 15, 30));
    expect(isGameCurrentlyLive("15:00", "2026-03-19")).toBe(true);
  });

  it("returns false before game starts", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 14, 59));
    expect(isGameCurrentlyLive("15:00", "2026-03-19")).toBe(false);
  });

  it("returns false for different date", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 15, 30));
    expect(isGameCurrentlyLive("15:00", "2026-03-20")).toBe(false);
  });
});

describe("getElapsedMinutes", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("returns elapsed minutes for football", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 15, 45));
    expect(getElapsedMinutes("15:00", "2026-03-19", "football")).toBe(45);
  });

  it("returns null after basketball duration+buffer", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 17, 45)); // 165min after 15:00
    expect(getElapsedMinutes("15:00", "2026-03-19", "basketball")).toBe(null);
  });

  it("returns elapsed for basketball within duration", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 15, 30));
    expect(getElapsedMinutes("15:00", "2026-03-19", "basketball")).toBe(30);
  });

  it("returns 0 at exact start", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 15, 0));
    expect(getElapsedMinutes("15:00", "2026-03-19")).toBe(0);
  });

  it("returns null before game", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 14, 59));
    expect(getElapsedMinutes("15:00", "2026-03-19")).toBe(null);
  });
});
