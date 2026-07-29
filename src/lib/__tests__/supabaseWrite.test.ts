import { describe, it, expect } from "vitest";
import { genId } from "../supabaseWrite";

describe("genId", () => {
  it("generates REQ prefix with current year", () => {
    const year = new Date().getFullYear();
    const id = genId("REQ");
    expect(id).toMatch(new RegExp(`^REQ-${year}-\\d{4}$`));
  });

  it("generates BLT prefix with last 3 digits", () => {
    const year = new Date().getFullYear();
    const id = genId("BLT");
    expect(id).toMatch(new RegExp(`^BLT-${year}-\\d{3}$`));
  });

  it("generates RPT prefix with current year", () => {
    const year = new Date().getFullYear();
    const id = genId("RPT");
    expect(id).toMatch(new RegExp(`^RPT-${year}-\\d{4}$`));
  });

  it("generates generic prefix with default length", () => {
    const id = genId("ANN");
    expect(id).toMatch(/^ANN-\d{4}$/);
  });

  it("respects custom length parameter", () => {
    const id = genId("TKN", 6);
    expect(id).toMatch(/^TKN-\d{6}$/);
  });

  it("produces different ids on successive calls", () => {
    const a = genId("RES");
    const b = genId("RES");
    expect(a).not.toBe(b);
  });
});
