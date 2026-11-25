import { describe, expect, it } from "vitest";

describe("test environment", () => {
  it("runs specs against a DOM with browser storage", () => {
    document.body.append(document.createElement("main"));

    expect(document.querySelector("main")).not.toBeNull();
    expect(typeof window.localStorage.setItem).toBe("function");
  });
});
