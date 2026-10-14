// Dependency-free unit tests for src/lib/validation.ts
// Run: node --experimental-strip-types tests/validation.test.mjs   (Node >= 22.6)
import assert from "node:assert/strict";
import { isHttpUrl, parsePositiveInt, jsonForScript } from "../src/lib/validation.ts";

// URL protocol allow-list
assert.equal(isHttpUrl("https://example.com/a?b=1"), true);
assert.equal(isHttpUrl("http://example.com"), true);
for (const bad of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<script>1</script>", "file:///etc/passwd", "ftp://x.com", "example.com", "", "//evil.com"]) {
  assert.equal(isHttpUrl(bad), false, `should reject ${bad}`);
}

// Pagination parsing (previously NaN -> Prisma 500)
assert.equal(parsePositiveInt("abc", 1), 1);
assert.equal(parsePositiveInt(null, 1), 1);
assert.equal(parsePositiveInt("", 12, 48), 12);
assert.equal(parsePositiveInt("0", 1), 1);
assert.equal(parsePositiveInt("-5", 1), 1);
assert.equal(parsePositiveInt("3", 1), 3);
assert.equal(parsePositiveInt("2.9", 1), 2);
assert.equal(parsePositiveInt("9999", 12, 48), 48);
assert.equal(parsePositiveInt("Infinity", 1), 1);

// JSON-LD must not be able to close the script tag
const out = jsonForScript([{ description: "</script><script>alert(1)</script>" }]);
assert.ok(!out.includes("</script"), "must escape </script");
assert.ok(!out.includes("<"), "must escape <");
assert.deepEqual(JSON.parse(out), [{ description: "</script><script>alert(1)</script>" }]);

console.log("validation tests: all passed");
