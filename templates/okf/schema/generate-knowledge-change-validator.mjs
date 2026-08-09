#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import standaloneCode from "ajv/dist/standalone/index.js";

const directory = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(directory, "okf-knowledge-change-1.schema.json");
const outputPath = resolve(directory, "okf-knowledge-change-1.validator.mjs");
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
  validateFormats: false,
  code: { source: true, esm: true, lines: true },
});
const validate = ajv.compile(schema);
const banner = "// Generated from okf-knowledge-change-1.schema.json by generate-knowledge-change-validator.mjs.\n// Runtime dependency-free; regenerate only through the reviewed schema workflow.\n";
const deepEqual = (name) => `const ${name} = function deepEqual(left, right) {
  if (left === right) return true;
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => Object.prototype.hasOwnProperty.call(right, key) && deepEqual(left[key], right[key]));
};`;
const unicodeLength = (name) => `const ${name} = function ucs2length(value) {
  let length = 0;
  for (let index = 0; index < value.length; index += 1) {
    length += 1;
    const first = value.charCodeAt(index);
    if (first >= 0xd800 && first <= 0xdbff && index + 1 < value.length) {
      const second = value.charCodeAt(index + 1);
      if ((second & 0xfc00) === 0xdc00) index += 1;
    }
  }
  return length;
};`;
const standalone = standaloneCode(ajv, validate)
  .replace(/const (func\d+) = require\("ajv\/dist\/runtime\/equal"\)\.default;/, (_, name) => deepEqual(name))
  .replace(/const (func\d+) = require\("ajv\/dist\/runtime\/ucs2length"\)\.default;/, (_, name) => unicodeLength(name));
if (standalone.includes("require(")) throw new Error("generated validator retained a runtime dependency");
const generated = `${banner}${standalone}`;
if (process.argv.includes("--check")) {
  const current = readFileSync(outputPath, "utf8");
  if (current !== generated) {
    console.error(`${outputPath} is stale; regenerate it with this script.`);
    process.exit(1);
  }
  console.log(`Verified ${outputPath}`);
} else {
  writeFileSync(outputPath, generated, "utf8");
  console.log(`Generated ${outputPath}`);
}
