import { isMap, parseDocument } from "./yaml-runtime.mjs";

const OPENING_DELIMITER = /^---[ \t]*\r?\n/;
const CLOSING_DELIMITER = /^(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/gm;

function diagnostic(error, source) {
  const position = error.linePos?.[0];
  const code = error.code === "DUPLICATE_KEY" ? "yaml-duplicate-key" : "yaml-parse-error";
  return {
    code,
    source,
    line: position?.line ?? null,
    column: position?.col ?? null,
    message: error.message.replace(/\s+at line \d+, column \d+:?$/, "").trim(),
  };
}

/**
 * Parse an optional YAML frontmatter mapping without changing the Markdown body.
 *
 * This parser is deliberately read-only. Consumers decide whether profile rules
 * make a parsed shape strict-invalid or legacy-compatible; parser diagnostics
 * only describe the YAML envelope.
 */
export function parseFrontmatter(content, source = "<memory>") {
  const text = content.startsWith("\uFEFF") ? content.slice(1) : content;
  const opening = text.match(OPENING_DELIMITER);
  if (!opening) {
    return { frontmatter: {}, body: content, diagnostics: [], hasFrontmatter: false, rawFrontmatter: "" };
  }

  CLOSING_DELIMITER.lastIndex = opening[0].length;
  const closing = CLOSING_DELIMITER.exec(text);
  if (!closing) {
    return {
      frontmatter: {},
      body: text,
      diagnostics: [{ code: "frontmatter-unclosed", source, line: 1, column: 1, message: "Opening frontmatter delimiter has no closing delimiter." }],
      hasFrontmatter: true,
      rawFrontmatter: text.slice(opening[0].length),
    };
  }

  const rawFrontmatter = text.slice(opening[0].length, closing.index);
  const body = text.slice(closing.index + closing[0].length);
  const document = parseDocument(rawFrontmatter, {
    keepSourceTokens: true,
    maxAliasCount: 0,
    prettyErrors: false,
    strict: true,
    uniqueKeys: true,
    version: "1.2",
  });
  const diagnostics = document.errors.map((error) => diagnostic(error, source));

  if (diagnostics.length > 0) {
    return { frontmatter: {}, body, diagnostics, hasFrontmatter: true, rawFrontmatter };
  }
  if (document.contents === null) {
    return {
      frontmatter: {},
      body,
      diagnostics: [{ code: "frontmatter-empty", source, line: 1, column: 1, message: "Frontmatter must contain one YAML mapping." }],
      hasFrontmatter: true,
      rawFrontmatter,
    };
  }
  if (!isMap(document.contents)) {
    return {
      frontmatter: {},
      body,
      diagnostics: [{ code: "frontmatter-not-mapping", source, line: 1, column: 1, message: "Frontmatter must be a YAML mapping." }],
      hasFrontmatter: true,
      rawFrontmatter,
    };
  }

  let frontmatter;
  try {
    frontmatter = document.toJS({ mapAsMap: false, maxAliasCount: 0 });
  } catch (error) {
    const unsafeAlias = /alias count/i.test(error.message);
    return {
      frontmatter: {},
      body,
      diagnostics: [{
        code: unsafeAlias ? "yaml-unsafe-alias" : "yaml-conversion-error",
        source,
        line: null,
        column: null,
        message: error.message,
      }],
      hasFrontmatter: true,
      rawFrontmatter,
    };
  }
  return { frontmatter, body, diagnostics: [], hasFrontmatter: true, rawFrontmatter };
}
