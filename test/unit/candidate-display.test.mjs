import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { maskName } from "../../src/lib/candidate-display.ts";

describe("maskName", () => {
  it("masks every word after its first letter", () => {
    assert.equal(maskName("Nadia Pratama"), "N***** P*****");
  });

  it("handles single-word and empty input", () => {
    assert.equal(maskName("A"), "A*****");
    assert.equal(maskName(""), "");
  });
});
