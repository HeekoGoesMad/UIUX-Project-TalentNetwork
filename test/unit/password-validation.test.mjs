import test from "node:test";
import assert from "node:assert/strict";
import { checkPasswordRequirements, isPasswordValid } from "../../src/lib/auth/password.ts";

test("checkPasswordRequirements", async (t) => {
  await t.test("evaluates requirements accurately", () => {
    // Empty
    assert.deepEqual(checkPasswordRequirements(""), {
      hasMinLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
    });

    // Too short but has other criteria
    assert.deepEqual(checkPasswordRequirements("Ab1!"), {
      hasMinLength: false,
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
    });

    // Valid length without number
    assert.deepEqual(checkPasswordRequirements("PasswordABC"), {
      hasMinLength: true,
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: false,
    });

    // Fully valid password
    assert.deepEqual(checkPasswordRequirements("SecurePass123"), {
      hasMinLength: true,
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
    });
  });
});

test("isPasswordValid", async (t) => {
  await t.test("returns true only when all 4 criteria are fulfilled", () => {
    assert.equal(isPasswordValid(""), false);
    assert.equal(isPasswordValid("weak"), false);
    assert.equal(isPasswordValid("short1A"), false);
    assert.equal(isPasswordValid("lowercaseonly1234"), false);
    assert.equal(isPasswordValid("UPPERCASEONLY1234"), false);
    assert.equal(isPasswordValid("NoNumbersHere!"), false);

    assert.equal(isPasswordValid("ValidPassword1"), true);
    assert.equal(isPasswordValid("StrongP@ssw0rd!"), true);
  });
});
