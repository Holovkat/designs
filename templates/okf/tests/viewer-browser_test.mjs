#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import {
  accessSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { release, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const okfDir = resolve(testDir, "..");
const viewerPath = join(okfDir, "viewer.html");
const viewerAssetsPath = join(okfDir, "viewer-assets");
const generatorPath = join(okfDir, "generate-viz.js");

function chromeExecutable() {
  const candidates = [
    process.env.OKF_CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  for (const candidate of candidates) {
    try { accessSync(candidate); return candidate; } catch {}
  }
  throw new Error("A Chromium-family browser is required; set OKF_CHROME_PATH (browser claims are not skipped)");
}

function createFixture(parent) {
  const knowledge = join(parent, "knowledge");
  mkdirSync(join(knowledge, "architecture"), { recursive: true });
  mkdirSync(join(knowledge, "decisions"), { recursive: true });
  mkdirSync(join(knowledge, "inbox", "processed"), { recursive: true });
  cpSync(viewerPath, join(knowledge, "viewer.html"));
  cpSync(viewerAssetsPath, join(knowledge, "viewer-assets"), { recursive: true });
  writeFileSync(join(knowledge, "decisions", "target.md"), [
    "---",
    "type: Decision",
    "id: okf-40000000-0000-4000-8000-000000000001",
    "title: Diagram Target",
    "description: Offline Mermaid target",
    "tags: [viewer, mermaid]",
    "status: active",
    "---",
    "# Diagram Target",
    "",
    "```mermaid",
    "flowchart TD",
    "  A[Reviewed] --> B[Offline]",
    "```",
    "",
  ].join("\n"));
  writeFileSync(join(knowledge, "architecture", "security.md"), [
    "---",
    "type: Architecture",
    "id: okf-40000000-0000-4000-8000-000000000002",
    "title: Security Payload",
    "description: Stored XSS and URL fixture",
    "tags: [viewer, security]",
    "status: active",
    "implements: [okf-40000000-0000-4000-8000-000000000001]",
    "resource: javascript:globalThis.__OKF_RESOURCE_XSS__=1",
    "---",
    "# Security Payload",
    "",
    "<script>globalThis.__OKF_SCRIPT_XSS__ = 1</script>",
    "<img src=\"https://network-canary.invalid/x\" onerror=\"globalThis.__OKF_IMAGE_XSS__=1\">",
    "<svg onload=\"globalThis.__OKF_SVG_XSS__=1\"></svg>",
    "<a href=\"javascript:globalThis.__OKF_LINK_XSS__=1\" onclick=\"globalThis.__OKF_CLICK_XSS__=1\">raw unsafe</a>",
    "",
    "[javascript link](javascript:globalThis.__OKF_LINK_XSS__=1)",
    "[entity javascript](jav&#x61;script:globalThis.__OKF_LINK_XSS__=1)",
    "[data link](data:text/html,boom)",
    "[HTTP link](http://example.test/unsafe)",
    "[protocol relative](//example.test/unsafe)",
    "[HTTPS link](https://example.test/approved)",
    "[local concept](../decisions/target.md)",
    "[encoded traversal](..%2f..%2foutside.md)",
    "[escaping local](../../../outside.md)",
    "",
    "```mermaid",
    "%%{init: {\"securityLevel\": \"loose\", \"flowchart\": {\"htmlLabels\": true}}}%%",
    "flowchart TD",
    "  X[\"<img src=x onerror=globalThis.__OKF_MERMAID_XSS__=1>\"] --> Y[Strict]",
    "  click X \"javascript:globalThis.__OKF_MERMAID_CLICK_XSS__=1\"",
    "```",
    "",
  ].join("\n"));
  writeFileSync(join(knowledge, "inbox", "pending.md"), "---\ntype: Inbox\ntitle: BROWSER-INBOX-SENTINEL\n---\nprivate\n");
  writeFileSync(join(knowledge, "inbox", "processed", "processed.md"), "---\ntype: Inbox\ntitle: BROWSER-PROCESSED-SENTINEL\n---\nprivate\n");
  const generated = spawnSync(process.execPath, [generatorPath, knowledge], { encoding: "utf8" });
  assert.equal(generated.status, 0, generated.stderr);
  return { knowledge, generated };
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolveOpen, rejectOpen) => {
      const timeout = setTimeout(() => rejectOpen(new Error("CDP websocket open timed out")), 10000);
      this.socket.addEventListener("open", () => { clearTimeout(timeout); resolveOpen(); }, { once: true });
      this.socket.addEventListener("error", () => { clearTimeout(timeout); rejectOpen(new Error("CDP websocket failed")); }, { once: true });
    });
    this.socket.addEventListener("message", event => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve: resolveCall, reject: rejectCall } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) rejectCall(new Error(`${message.error.code}: ${message.error.message}`));
        else resolveCall(message.result || {});
        return;
      }
      for (const listener of this.listeners.get(message.method) || []) listener(message.params || {});
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolveCall, rejectCall) => {
      this.pending.set(id, { resolve: resolveCall, reject: rejectCall });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  waitFor(method, predicate = () => true, timeoutMs = 10000) {
    return new Promise((resolveEvent, rejectEvent) => {
      const listeners = this.listeners.get(method) || [];
      const timeout = setTimeout(() => {
        this.listeners.set(method, listeners.filter(listener => listener !== receive));
        rejectEvent(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
      const receive = params => {
        if (!predicate(params)) return;
        clearTimeout(timeout);
        this.listeners.set(method, (this.listeners.get(method) || []).filter(listener => listener !== receive));
        resolveEvent(params);
      };
      listeners.push(receive);
      this.listeners.set(method, listeners);
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) || [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  close() {
    this.socket?.close();
  }
}

async function waitForDevTools(child) {
  return new Promise((resolveEndpoint, rejectEndpoint) => {
    let stderr = "";
    const timeout = setTimeout(() => rejectEndpoint(new Error(`Chrome DevTools endpoint timed out\n${stderr}`)), 15000);
    child.stderr.on("data", chunk => {
      stderr += chunk.toString();
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timeout); resolveEndpoint(match[1]); }
    });
    child.once("exit", code => {
      clearTimeout(timeout);
      rejectEndpoint(new Error(`Chrome exited before DevTools was ready (${code})\n${stderr}`));
    });
  });
}

async function pageTarget(endpoint) {
  const address = new URL(endpoint);
  const response = await fetch(`http://${address.host}/json/list`);
  assert.equal(response.ok, true);
  const targets = await response.json();
  const page = targets.find(target => target.type === "page");
  assert.ok(page?.webSocketDebuggerUrl, "Chrome page target missing");
  return page.webSocketDebuggerUrl;
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result?.value;
}

async function eventually(client, expression, predicate = Boolean, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let value;
  while (Date.now() < deadline) {
    value = await evaluate(client, expression);
    if (predicate(value)) return value;
    await new Promise(resolveWait => setTimeout(resolveWait, 100));
  }
  throw new Error(`Browser condition timed out: ${expression} (last value: ${JSON.stringify(value)})`);
}

const parent = mkdtempSync(join(tmpdir(), "okf-viewer-browser-"));
let chrome;
let client;
try {
  const executable = chromeExecutable();
  const browserVersion = spawnSync(executable, ["--version"], { encoding: "utf8" }).stdout.trim();
  const assetManifest = JSON.parse(readFileSync(join(viewerAssetsPath, "manifest.json"), "utf8"));
  const runtimeLock = JSON.parse(readFileSync(join(okfDir, "runtime", "package-lock.json"), "utf8"));
  const yamlRuntime = runtimeLock.packages["node_modules/yaml"];
  const fixture = createFixture(parent);
  const testManifest = {
    schema: "okf-viewer-browser-test/1",
    host: { platform: process.platform, architecture: process.arch, release: release() },
    node: process.version,
    generator_dependencies: {
      node_builtins: true,
      packaged_frontmatter_parser: "okf-c7",
      yaml: { version: yamlRuntime.version, integrity: yamlRuntime.integrity },
    },
    viewer_assets: Object.fromEntries(assetManifest.assets.map(asset => [asset.file, { version: asset.version, sha256: asset.sha256 }])),
    browser: browserVersion,
    network: "offline-before-navigation",
    dataset: "isolated-temporary-okf-fixture",
  };
  console.log(`TEST MANIFEST ${JSON.stringify(testManifest)}`);

  const profile = join(parent, "chrome-profile");
  chrome = spawn(executable, [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-domain-reliability",
    "--disable-features=OptimizationHints,MediaRouter",
    "--disable-sync",
    "--metrics-recording-only",
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  const endpoint = await waitForDevTools(chrome);
  client = new CdpClient(await pageTarget(endpoint));
  await client.connect();

  const requests = [];
  const exceptions = [];
  client.on("Network.requestWillBeSent", event => requests.push(event.request.url));
  client.on("Runtime.exceptionThrown", event => exceptions.push(event.exceptionDetails?.exception?.description || event.exceptionDetails?.text));
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Network.enable");
  await client.send("Network.emulateNetworkConditions", {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0,
    connectionType: "none",
  });

  const loaded = client.waitFor("Page.loadEventFired");
  const navigation = await client.send("Page.navigate", { url: pathToFileURL(join(fixture.knowledge, "viz.html")).href });
  assert.equal(navigation.errorText, undefined, navigation.errorText);
  await loaded;
  await eventually(client, "document.querySelectorAll('.tree-file').length", count => count === 2);

  const initial = await evaluate(client, `({
    concepts: document.querySelectorAll('.tree-file').length,
    stats: document.getElementById('stats').textContent,
    inboxVisible: document.body.textContent.includes('BROWSER-INBOX-SENTINEL') || document.body.textContent.includes('BROWSER-PROCESSED-SENTINEL'),
    mermaidSecurity: globalThis.mermaid?.mermaidAPI?.getConfig?.().securityLevel || globalThis.mermaid?.getConfig?.().securityLevel || '',
    graphRuntime: typeof globalThis.cytoscape,
    markdownRuntime: typeof globalThis.marked?.parse,
    sanitizerRuntime: typeof globalThis.DOMPurify?.sanitize,
  })`);
  assert.equal(initial.concepts, 2);
  assert.match(initial.stats, /inbox excluded/);
  assert.equal(initial.inboxVisible, false);
  assert.equal(initial.mermaidSecurity, "strict");
  assert.equal(initial.graphRuntime, "function");
  assert.equal(initial.markdownRuntime, "function");
  assert.equal(initial.sanitizerRuntime, "function");

  const searchEvidence = await evaluate(client, `(() => {
    const search = document.getElementById('search');
    search.value = 'security payload';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    const filtered = [...document.querySelectorAll('.tree-file')].map(node => node.textContent.trim());
    search.value = '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    return { filtered, restored: document.querySelectorAll('.tree-file').length };
  })()`);
  assert.deepEqual(searchEvidence.filtered, ["Security Payload"]);
  assert.equal(searchEvidence.restored, 2);

  await evaluate(client, `[...document.querySelectorAll('.tree-file')].find(node => node.textContent.includes('Security Payload')).click()`);
  await eventually(client, "document.querySelector('#detail .body')?.textContent.includes('Security Payload')", Boolean);
  await new Promise(resolveWait => setTimeout(resolveWait, 750));
  const security = await evaluate(client, `(() => {
    const panel = document.querySelector('#detail');
    const links = Object.fromEntries([...panel.querySelectorAll('.body a')].map(anchor => [anchor.textContent.trim(), anchor.getAttribute('href')]));
    const eventAttributes = [...panel.querySelectorAll('*')].flatMap(element => [...element.attributes].filter(attribute => /^on/i.test(attribute.name)).map(attribute => attribute.name));
    const unsafeMermaidHrefs = [...panel.querySelectorAll('.mermaid *')].filter(element => element.hasAttribute('href') || element.hasAttribute('xlink:href')).map(element => element.getAttribute('href') || element.getAttribute('xlink:href')).filter(href => href && !href.startsWith('#') && !href.startsWith('https://'));
    return {
      canaries: [
        globalThis.__OKF_SCRIPT_XSS__, globalThis.__OKF_IMAGE_XSS__, globalThis.__OKF_SVG_XSS__,
        globalThis.__OKF_LINK_XSS__, globalThis.__OKF_CLICK_XSS__, globalThis.__OKF_RESOURCE_XSS__,
        globalThis.__OKF_MERMAID_XSS__, globalThis.__OKF_MERMAID_CLICK_XSS__,
      ].map(value => value || 0),
      forbiddenElements: [...panel.querySelectorAll('.body script, .body img, .body svg, .body iframe, .body object, .body embed')].filter(element => !element.closest('.mermaid')).length,
      eventAttributes,
      links,
      resourceLinked: Boolean(panel.querySelector('.frontmatter a[href]')),
      unsafeMermaidHrefs,
      relationship: panel.querySelector('.relationships')?.textContent || '',
    };
  })()`);
  assert.deepEqual(security.canaries, [0, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(security.forbiddenElements, 0);
  assert.deepEqual(security.eventAttributes, []);
  assert.equal(security.links["javascript link"], null);
  assert.equal(security.links["entity javascript"], null);
  assert.equal(security.links["data link"], null);
  assert.equal(security.links["HTTP link"], null);
  assert.equal(security.links["protocol relative"], null);
  assert.equal(security.links["HTTPS link"], "https://example.test/approved");
  assert.equal(security.links["local concept"], "../knowledge/decisions/target.md");
  assert.equal(security.links["encoded traversal"], null);
  assert.equal(security.links["escaping local"], null);
  assert.equal(security.resourceLinked, false);
  assert.deepEqual(security.unsafeMermaidHrefs, []);
  assert.match(security.relationship, /implements/);

  const cspCanary = await evaluate(client, `(async () => {
    globalThis.__OKF_CSP_XSS__ = 0;
    const script = document.createElement('script');
    script.textContent = 'globalThis.__OKF_CSP_XSS__ = 1';
    document.body.appendChild(script);
    await new Promise(resolve => setTimeout(resolve, 50));
    return globalThis.__OKF_CSP_XSS__;
  })()`);
  assert.equal(cspCanary, 0, "CSP allowed an injected inline script");

  await evaluate(client, `[...document.querySelectorAll('.tree-file')].find(node => node.textContent.includes('Diagram Target')).click()`);
  await eventually(client, "document.querySelectorAll('#detail .mermaid svg').length", count => count === 1);
  await evaluate(client, `document.getElementById('nav-graph').click()`);
  await eventually(client, "document.querySelectorAll('#cy canvas').length", count => count > 0);
  const graphEvidence = await evaluate(client, `({
    canvas: document.querySelectorAll('#cy canvas').length,
    legend: document.getElementById('graph-legend').textContent,
    filters: document.querySelectorAll('.filter-btn').length,
  })`);
  assert.ok(graphEvidence.canvas > 0);
  assert.match(graphEvidence.legend, /implements/);
  assert.equal(graphEvidence.filters, 2);

  const remoteRequests = requests.filter(url => /^https?:/i.test(url));
  assert.deepEqual(remoteRequests, []);
  assert.equal(exceptions.length, 0, exceptions.join("\n"));
  console.log(`PASS offline browser blocks stored XSS, unsafe schemes, and inline CSP execution (${requests.length} local/data requests)`);
  console.log("PASS offline browser preserves Markdown, strict Mermaid, search, graph, filters, and typed relationships");
} finally {
  client?.close();
  if (chrome && chrome.exitCode == null) {
    chrome.kill("SIGTERM");
    await new Promise(resolveExit => {
      const timeout = setTimeout(() => { if (chrome.exitCode == null) chrome.kill("SIGKILL"); resolveExit(); }, 3000);
      chrome.once("exit", () => { clearTimeout(timeout); resolveExit(); });
    });
  }
  rmSync(parent, { recursive: true, force: true });
}
