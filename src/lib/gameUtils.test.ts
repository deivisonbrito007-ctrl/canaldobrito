import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isGameCurrentlyLive, getLocalDateString, getElapsedMinutes } from "./gameUtils";

describe("getLocalDateString", () => {
  it("returns YYYY-MM-DD format", () => {
    const result = getLocalDateString(new Date(2026, 2, 19)); // March 19, 2026
    expect(result).toBe("2026-03-19");
  });

  it("pads single-digit month and day", () => {
    const result = getLocalDateString(new Date(2026, 0, 5)); // Jan 5
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

describe("isGameCurrentlyLive", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true when within 90-minute window", () => {
    // Set time to 15:30 on March 19, 2026
    vi.setSystemTime(new Date(2026, 2, 19, 15, 30));
    expect(isGameCurrentlyLive("15:00", "2026-03-19")).toBe(true);
  });

  it("returns false before game starts", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 14, 59));
    expect(isGameCurrentlyLive("15:00", "2026-03-19")).toBe(false);
  });

  it("returns false after 90 minutes", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 16, 30));
    expect(isGameCurrentlyLive("15:00", "2026-03-19")).toBe(false);
  });

  it("returns false for different date", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 15, 30));
    expect(isGameCurrentlyLive("15:00", "2026-03-20")).toBe(false);
  });

  it("returns true at exact start time", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 15, 0));
    expect(isGameCurrentlyLive("15:00", "2026-03-19")).toBe(true);
  });

  it("returns false at exactly 90 minutes", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 16, 30));
    expect(isGameCurrentlyLive("15:00", "2026-03-19")).toBe(false);
  });
});

describe("getElapsedMinutes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns elapsed minutes during game", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 15, 45));
    expect(getElapsedMinutes("15:00", "2026-03-19")).toBe(45);
  });

  it("returns 0 at exact start", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 15, 0));
    expect(getElapsedMinutes("15:00", "2026-03-19")).toBe(0);
  });

  it("returns null before game", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 14, 59));
    expect(getElapsedMinutes("15:00", "2026-03-19")).toBe(null);
  });

  it("returns null after 90 minutes", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 16, 30));
    expect(getElapsedMinutes("15:00", "2026-03-19")).toBe(null);
  });

  it("returns null for different date", () => {
    vi.setSystemTime(new Date(2026, 2, 19, 15, 30));
    expect(getElapsedMinutes("15:00", "2026-03-20")).toBe(null);
  });
});
