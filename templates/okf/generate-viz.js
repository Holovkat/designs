#!/usr/bin/env node
/**
 * generate-viz.js — reads reviewed Markdown concepts from a knowledge/ directory
 * and produces a deterministic offline viz.html dataset.
 *
 * Usage: node generate-viz.js [--include-inbox] [knowledge-dir]
 *   Defaults to the current directory and excludes all inbox content.
 *   --include-inbox is an explicit, non-default disclosure of pending,
 *   processed, and archived inbox records.
 *
 * Output: <knowledge-dir>/viz.html plus the local viewer-assets/ directory.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pathToFileURL } = require("url");

const DATA_MARKER = '{"schema":"okf-viewer-data/1","policy":{"inbox":"excluded"},"asset_manifest":"viewer-assets/manifest.json","asset_hashes":{},"included_paths":[],"items":null}';
const ASSET_MANIFEST_PATH = "viewer-assets/manifest.json";
const NOFOLLOW = fs.constants.O_NOFOLLOW || 0;

function compareNames(left, right) {
	return left < right ? -1 : left > right ? 1 : 0;
}

function fail(message) {
	const error = new Error(message);
	error.code = "okf-viewer-boundary";
	throw error;
}

function parseArguments(argv) {
	let knowledgeDir = ".";
	let directorySeen = false;
	let includeInbox = false;
	for (const argument of argv) {
		if (argument === "--include-inbox") {
			if (includeInbox) fail("Duplicate option: --include-inbox");
			includeInbox = true;
		} else if (argument === "--help" || argument === "-h") {
			return { help: true, includeInbox: false, knowledgeDir: "." };
		} else if (argument.startsWith("-")) {
			fail(`Unknown option: ${argument}`);
		} else if (directorySeen) {
			fail("Only one knowledge directory may be supplied");
		} else {
			knowledgeDir = argument;
			directorySeen = true;
		}
	}
	return { help: false, includeInbox, knowledgeDir };
}

function usage() {
	return [
		"Usage: node generate-viz.js [--include-inbox] [knowledge-dir]",
		"  Default: exclude knowledge/inbox pending, processed, and archived records.",
		"  --include-inbox: explicitly include the complete inbox tree in the viewer dataset.",
	].join("\n");
}

function isContained(root, candidate) {
	const relative = path.relative(root, candidate);
	return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function canonicalDirectory(input, label) {
	const requested = path.resolve(input);
	let stat;
	try {
		stat = fs.lstatSync(requested);
	} catch (error) {
		fail(`${label} is unavailable: ${requested} (${error.code || error.message})`);
	}
	if (stat.isSymbolicLink()) fail(`${label} must not be a symbolic link: ${requested}`);
	if (!stat.isDirectory()) fail(`${label} must be a directory: ${requested}`);
	const physical = fs.realpathSync.native(requested);
	if (!fs.lstatSync(physical).isDirectory()) fail(`${label} physical path is not a directory: ${physical}`);
	return physical;
}

function securePathInfo(root, candidate, label, expectedKind) {
	const lexical = path.resolve(candidate);
	if (!isContained(root, lexical)) fail(`${label} escapes the allowed root: ${lexical}`);
	let stat;
	try {
		stat = fs.lstatSync(lexical);
	} catch (error) {
		fail(`${label} is unavailable: ${lexical} (${error.code || error.message})`);
	}
	if (stat.isSymbolicLink()) fail(`${label} must not be a symbolic link: ${lexical}`);
	if (expectedKind === "file" && !stat.isFile()) fail(`${label} must be a regular file: ${lexical}`);
	if (expectedKind === "directory" && !stat.isDirectory()) fail(`${label} must be a directory: ${lexical}`);
	const physical = fs.realpathSync.native(lexical);
	if (!isContained(root, physical)) fail(`${label} resolves outside the allowed root: ${lexical} -> ${physical}`);
	return { lexical, physical, stat };
}

function readSecureRegular(root, candidate, label, encoding = null) {
	const info = securePathInfo(root, candidate, label, "file");
	let descriptor;
	try {
		descriptor = fs.openSync(info.physical, fs.constants.O_RDONLY | NOFOLLOW);
		const opened = fs.fstatSync(descriptor);
		if (!opened.isFile()) fail(`${label} changed before it could be read safely: ${info.physical}`);
		const content = fs.readFileSync(descriptor, encoding || undefined);
		return content;
	} finally {
		if (descriptor !== undefined) fs.closeSync(descriptor);
	}
}

function readDirRecursive(root, directory, options, prefix = "") {
	securePathInfo(root, directory, prefix ? `Concept directory ${prefix}` : "Knowledge directory", "directory");
	const results = [];
	const entries = fs.readdirSync(directory, { withFileTypes: true })
		.sort((left, right) => compareNames(left.name, right.name));
	for (const entry of entries) {
		if (entry.name.startsWith(".")) continue;
		const filepath = prefix ? `${prefix}/${entry.name}` : entry.name;
		const fullPath = path.join(directory, entry.name);
		const info = securePathInfo(root, fullPath, `Knowledge entry ${filepath}`, entry.isDirectory() ? "directory" : "file");
		if (entry.isDirectory()) {
			if (!prefix && entry.name === "inbox" && !options.includeInbox) continue;
			results.push(...readDirRecursive(root, info.physical, options, filepath));
		} else if (entry.name.endsWith(".md") && entry.name !== "index.md" && entry.name !== "log.md") {
			results.push({ filepath, content: readSecureRegular(root, info.physical, `Concept file ${filepath}`, "utf8") });
		}
	}
	return results;
}

function parserCandidates(knowledgeDir) {
	const sourceRoot = fs.realpathSync.native(__dirname);
	const projectRoot = path.dirname(knowledgeDir);
	const installedRoot = path.join(projectRoot, ".okf");
	return [
		{
			// Source-repository layout: templates/okf/generate-viz.js + lib/.
			candidate: path.join(sourceRoot, "lib", "frontmatter.mjs"),
			distributionRoot: sourceRoot,
		},
		{
			// Installed layout: knowledge/generate-viz.js + project/.okf/lib/.
			candidate: path.join(installedRoot, "lib", "frontmatter.mjs"),
			distributionRoot: installedRoot,
		},
	];
}

function auditContainedTree(root, directory, label) {
	const info = securePathInfo(root, directory, label, "directory");
	for (const entry of fs.readdirSync(info.physical, { withFileTypes: true }).sort((left, right) => compareNames(left.name, right.name))) {
		const child = path.join(info.physical, entry.name);
		const childLabel = `${label}/${entry.name}`;
		const childInfo = securePathInfo(root, child, childLabel, entry.isDirectory() ? "directory" : "file");
		if (entry.isDirectory()) auditContainedTree(root, childInfo.physical, childLabel);
	}
}

function secureParserCandidate(candidate, distributionRoot) {
	let stat;
	try {
		stat = fs.lstatSync(candidate);
	} catch (error) {
		if (error.code === "ENOENT") return null;
		fail(`Parser candidate is unavailable: ${candidate} (${error.code || error.message})`);
	}
	if (stat.isSymbolicLink()) fail(`Parser candidate must not be a symbolic link: ${candidate}`);
	const physicalRoot = canonicalDirectory(distributionRoot, "Parser distribution root");
	const physical = securePathInfo(physicalRoot, candidate, "Parser candidate", "file").physical;
	securePathInfo(physicalRoot, path.join(path.dirname(physical), "yaml-runtime.mjs"), "Parser runtime adapter", "file");
	auditContainedTree(physicalRoot, path.join(physicalRoot, "runtime"), "Parser runtime");
	return physical;
}

async function loadPackagedParser(knowledgeDir) {
	const errors = [];
	const seen = new Set();
	for (const item of parserCandidates(knowledgeDir)) {
		const candidate = secureParserCandidate(item.candidate, item.distributionRoot);
		if (!candidate || seen.has(candidate)) continue;
		seen.add(candidate);
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

function sha256(value) {
	return crypto.createHash("sha256").update(value).digest("hex");
}

function validateViewerAssets(knowledgeDir, viewerHtml) {
	const manifestPath = path.join(knowledgeDir, ASSET_MANIFEST_PATH);
	const manifestText = readSecureRegular(knowledgeDir, manifestPath, "Viewer asset manifest", "utf8");
	let manifest;
	try {
		manifest = JSON.parse(manifestText);
	} catch (error) {
		fail(`Viewer asset manifest is invalid JSON: ${error.message}`);
	}
	if (manifest.schema !== "okf-viewer-assets/1" || manifest.offline !== true || !Array.isArray(manifest.assets)) {
		fail("Viewer asset manifest does not declare the okf-viewer-assets/1 offline contract");
	}
	const scriptSources = [...viewerHtml.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/gi)].map((match) => match[1]);
	if (scriptSources.length === 0 || scriptSources.some((source) => !source.startsWith("./viewer-assets/"))) {
		fail("Viewer executable scripts must use only local viewer-assets paths");
	}
	const expectedFiles = scriptSources.map((source) => source.slice("./viewer-assets/".length));
	const records = new Map();
	for (const record of manifest.assets) {
		if (!record || typeof record.file !== "string" || !/^[a-z0-9][a-z0-9._-]*$/i.test(record.file) ||
			typeof record.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(record.sha256)) {
			fail("Viewer asset manifest contains an invalid asset record");
		}
		if (records.has(record.file)) fail(`Viewer asset manifest repeats ${record.file}`);
		records.set(record.file, record);
	}
	if (expectedFiles.length !== records.size || expectedFiles.some((file) => !records.has(file))) {
		fail("Viewer script sources and the reviewed asset manifest do not match exactly");
	}
	const hashes = {};
	for (const file of expectedFiles) {
		const content = readSecureRegular(knowledgeDir, path.join(knowledgeDir, "viewer-assets", file), `Viewer asset ${file}`);
		const actual = sha256(content);
		if (actual !== records.get(file).sha256) fail(`Viewer asset hash mismatch: ${file}`);
		hashes[file] = actual;
	}
	return hashes;
}

function serializeForDataBlock(value) {
	return JSON.stringify(value)
		.replace(/</g, "\\u003c")
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
}

function assertOutputPath(knowledgeDir, outputPath) {
	const lexical = path.resolve(outputPath);
	if (!isContained(knowledgeDir, lexical) || path.dirname(lexical) !== knowledgeDir) {
		fail(`Viewer output escapes the knowledge root: ${lexical}`);
	}
	try {
		const stat = fs.lstatSync(lexical);
		if (stat.isSymbolicLink()) fail(`Viewer output must not be a symbolic link: ${lexical}`);
		if (!stat.isFile()) fail(`Viewer output must be a regular file: ${lexical}`);
		const physical = fs.realpathSync.native(lexical);
		if (!isContained(knowledgeDir, physical)) fail(`Viewer output resolves outside the knowledge root: ${lexical} -> ${physical}`);
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	return lexical;
}

function writeAtomic(knowledgeDir, outputPath, content) {
	const temporary = path.join(knowledgeDir, `.viz.html.${process.pid}.${crypto.randomBytes(8).toString("hex")}.tmp`);
	let descriptor;
	try {
		descriptor = fs.openSync(temporary, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | NOFOLLOW, 0o644);
		fs.writeFileSync(descriptor, content, "utf8");
		fs.fsyncSync(descriptor);
		fs.closeSync(descriptor);
		descriptor = undefined;
		securePathInfo(knowledgeDir, temporary, "Temporary viewer output", "file");
		fs.renameSync(temporary, outputPath);
	} finally {
		if (descriptor !== undefined) fs.closeSync(descriptor);
		try { fs.unlinkSync(temporary); } catch (error) { if (error.code !== "ENOENT") throw error; }
	}
}

async function main() {
	const options = parseArguments(process.argv.slice(2));
	if (options.help) {
		console.log(usage());
		return;
	}
	const knowledgeDir = canonicalDirectory(options.knowledgeDir, "Knowledge directory");
	const viewerPath = path.join(knowledgeDir, "viewer.html");
	const outputPath = assertOutputPath(knowledgeDir, path.join(knowledgeDir, "viz.html"));
	const viewerHtml = readSecureRegular(knowledgeDir, viewerPath, "Viewer template", "utf8");
	if (viewerHtml.indexOf(DATA_MARKER) < 0 || viewerHtml.indexOf(DATA_MARKER) !== viewerHtml.lastIndexOf(DATA_MARKER)) {
		fail("viewer.html must contain exactly one embedded-data marker");
	}
	const assetHashes = validateViewerAssets(knowledgeDir, viewerHtml);

	console.log("Reading knowledge bundle from:", knowledgeDir);
	const parser = await loadPackagedParser(knowledgeDir);
	if (parser && parser.unavailable) {
		console.warn("Warning: packaged C7 parser runtime unavailable; retaining legacy read-only viewer parsing.");
		for (const error of parser.errors) console.warn(`  ${error}`);
	}
	const files = attachParsedFrontmatter(readDirRecursive(knowledgeDir, knowledgeDir, options), parser);
	const includedPaths = files.map((item) => item.filepath);
	const inboxPolicy = options.includeInbox ? "included-explicitly" : "excluded";
	console.log(`Found ${files.length} concept files (inbox ${inboxPolicy})`);

	const envelope = {
		schema: "okf-viewer-data/1",
		policy: { inbox: inboxPolicy },
		asset_manifest: ASSET_MANIFEST_PATH,
		asset_hashes: assetHashes,
		included_count: files.length,
		included_paths: includedPaths,
		items: files,
	};
	const cleanVizHtml = viewerHtml.replace(DATA_MARKER, () => serializeForDataBlock(envelope));
	writeAtomic(knowledgeDir, outputPath, cleanVizHtml);
	console.log(`Included dataset SHA-256: ${sha256(JSON.stringify(includedPaths))}`);
	console.log(`Generated: ${outputPath}`);
	console.log("Open viz.html locally; no network runtime is required.");
}

main().catch((error) => {
	console.error(`Error: ${error.message}`);
	process.exitCode = 1;
});
