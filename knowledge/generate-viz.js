#!/usr/bin/env node
/**
 * generate-viz.js — reads all .md files in a knowledge/ directory
 * and produces a self-contained viz.html with the data embedded.
 *
 * Usage: node generate-viz.js [knowledge-dir]
 *   Defaults to current directory if no argument given.
 *
 * Output: <knowledge-dir>/viz.html (auto-loads in any browser, no folder picker needed)
 */

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

function readDirRecursive(dir, prefix = "") {
	const results = [];
	const entries = fs.readdirSync(dir, { withFileTypes: true })
		.sort((left, right) => left.name.localeCompare(right.name));
	for (const entry of entries) {
		if (entry.name.startsWith(".")) continue;
		if (entry.name === "viewer.html" || entry.name === "viz.html") continue;
		const filepath = prefix ? `${prefix}/${entry.name}` : entry.name;
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...readDirRecursive(fullPath, filepath));
		} else if (entry.name.endsWith(".md") && entry.name !== "index.md" && entry.name !== "log.md") {
			results.push({ filepath, content: fs.readFileSync(fullPath, "utf-8") });
		}
	}
	return results;
}

function parserCandidates(knowledgeDir) {
	const absoluteKnowledgeDir = path.resolve(knowledgeDir);
	return [
		// Source-repository layout: templates/okf/generate-viz.js + lib/.
		path.join(__dirname, "lib", "frontmatter.mjs"),
		// Installed layout: knowledge/generate-viz.js + project/.okf/lib/.
		path.join(path.dirname(absoluteKnowledgeDir), ".okf", "lib", "frontmatter.mjs"),
	];
}

async function loadPackagedParser(knowledgeDir) {
	const errors = [];
	for (const candidate of [...new Set(parserCandidates(knowledgeDir))]) {
		if (!fs.existsSync(candidate)) continue;
		try {
			const loaded = await import(pathToFileURL(candidate).href);
			if (typeof loaded.parseFrontmatter === "function") return loaded.parseFrontmatter;
			errors.push(`${candidate}: parseFrontmatter export is missing`);
		} catch (error) {
			errors.push(`${candidate}: ${error.message}`);
		}
	}
	return { unavailable: true, errors };
}

function attachParsedFrontmatter(files, parser) {
	if (typeof parser !== "function") return files;
	return files.map((item) => {
		try {
			const parsed = parser(item.content, item.filepath);
			return {
				...item,
				parsed: {
					parser: "okf-c7",
					frontmatter: parsed.frontmatter,
					body: parsed.body,
					diagnostics: parsed.diagnostics,
					hasFrontmatter: parsed.hasFrontmatter,
				},
			};
		} catch (error) {
			// A single parser failure must not prevent legacy read-only viewing.
			return {
				...item,
				parserFailure: { code: "c7-parser-failure", message: error.message },
			};
		}
	});
}

function serializeForInlineScript(value) {
	return JSON.stringify(value)
		.replace(/</g, "\\u003c")
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
}

async function main() {
	const knowledgeDir = process.argv[2] || ".";
	const viewerPath = path.join(knowledgeDir, "viewer.html");

	if (!fs.existsSync(viewerPath)) {
		console.error("Error: viewer.html not found in", knowledgeDir);
		console.error("Run this script from inside a knowledge/ directory that has viewer.html");
		process.exitCode = 1;
		return;
	}

	console.log("Reading knowledge bundle from:", path.resolve(knowledgeDir));
	const parser = await loadPackagedParser(knowledgeDir);
	if (parser && parser.unavailable) {
		console.warn("Warning: packaged C7 parser runtime unavailable; retaining legacy read-only viewer parsing.");
		for (const error of parser.errors) console.warn(`  ${error}`);
	}
	const files = attachParsedFrontmatter(readDirRecursive(knowledgeDir), parser);
	console.log(`Found ${files.length} concept files`);

	const viewerHtml = fs.readFileSync(viewerPath, "utf-8");
	const marker = "let __OKF_DATA__ = null;";
	if (!viewerHtml.includes(marker)) {
		console.error("Error: viewer.html does not contain the embedded-data marker");
		process.exitCode = 1;
		return;
	}

	const dataJson = serializeForInlineScript(files);
	const cleanVizHtml = viewerHtml.replace(marker, () => `__OKF_DATA__ = ${dataJson};`);
	const outputPath = path.join(knowledgeDir, "viz.html");
	fs.writeFileSync(outputPath, cleanVizHtml, "utf-8");
	console.log(`Generated: ${outputPath}`);
	console.log("Open in any browser to view the knowledge graph.");
}

main().catch((error) => {
	console.error(`Error: ${error.message}`);
	process.exitCode = 1;
});
