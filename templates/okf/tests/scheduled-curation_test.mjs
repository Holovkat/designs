#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildScheduledSubprocessEnv,
  inspectScheduledContext,
  runScheduledCuration,
  validateScheduledConfig,
} from "../lib/scheduled-curation.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const scheduledPrompt = resolve(here, "../templates/scheduled-curation-prompt.md");
let failures = 0;

async function test(name, run) {
  try {
    await run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}: ${error.stack ?? error.message}`);
  }
}

function sha(value) {
  return createHash("sha256").update(value).digest("hex");
}

function git(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: null });
  assert.equal(result.status, 0, result.stderr?.toString("utf8"));
  return result.stdout.toString("utf8").trim();
}

function configFor(root, binary, { enabled = true, allowUnrelated = false } = {}) {
  return {
    version: "okf-scheduled-curation/1",
    enabled,
    root,
    canonical_branch: "main",
    allow_unrelated_worktree_changes: allowUnrelated,
    operator: {
      identity: "fixture-operator",
      approval_ref: "fixture-approval-2026-08-08",
      request: "Run one bounded scheduled OKF curation batch for this fixture repository only.",
    },
    expected_outcome: "Curate one fixture inbox item into one strict permanent concept.",
    recovery_plan: "Keep bounded evidence, activate the kill switch on failure, and require fixture operator review.",
    selection: { mode: "actionable-lexical-first", max_items: 1 },
    limits: {
      max_items: 1,
      max_input_bytes: 16 * 1024,
      max_generated_bytes: 128 * 1024,
      max_runtime_seconds: 10,
      max_context_bytes: 256 * 1024,
      max_model_output_bytes: 64 * 1024,
      max_model_runtime_seconds: 10,
      max_total_runtime_seconds: 30,
      max_sessions: 1,
    },
    generator: {
      kind: "droid-exec",
      binary,
      binary_sha256: sha(readFileSync(binary)),
      model: "gpt-5.6-terra",
      reasoning: "medium",
    },
    retry_policy: "never",
    failure_policy: "activate-kill-switch",
    commit: { enabled: true, subject_prefix: "okf-curation:" },
  };
}

function sessionItem(commitSha) {
  return `---
type: Inbox
title: Scheduled fixture knowledge
description: A bounded fixture capture for scheduled curation
tags: [fixture, okf]
timestamp: 2026-08-08T00:00:00Z
generated_at: 2026-08-08T00:00:00Z
generated_by: fixture
session_id: 019fdf95-f1bf-7993-b356-773384f81bee
commit_sha: [${commitSha}]
branch: main
capture_tier: session
---

# Decisions Made

Use one bounded scheduled fixture.

# What Was Deprecated

Nothing.

# Lessons Learned

One session and no retry.

# Current State

Ready for fixture curation.
`;
}

function conceptText() {
  return `---
type: Decision
id: okf-11111111-1111-4111-8111-111111111111
title: Scheduled Fixture Knowledge
description: One bounded fixture decision
resource: knowledge/inbox/2026-08-08T00-00-00Z-scheduled-fixture.md
tags: [fixture, okf]
timestamp: 2026-08-08T00:00:00Z
status: active
assertion_state: proposed
generated_at: 2026-08-08T00:00:00Z
generated_by: okf-scheduled-curation
---

# Decision

Use one bounded fixture attempt.
`;
}

function makeRepo(options = {}) {
  const parent = mkdtempSync(join(tmpdir(), "okf-scheduled-test-"));
  const createdRoot = join(parent, "repo");
  mkdirSync(createdRoot, { recursive: true });
  const root = realpathSync(createdRoot);
  mkdirSync(join(root, "knowledge", "inbox", "processed"), { recursive: true });
  for (const directory of ["architecture", "components", "domain", "decisions", "deprecation", "process", "state"]) {
    mkdirSync(join(root, "knowledge", directory), { recursive: true });
    writeFileSync(join(root, "knowledge", directory, "index.md"), `# ${directory}\n`);
  }
  mkdirSync(join(root, ".okf", "templates"), { recursive: true });
  mkdirSync(join(root, ".okf", "agents"), { recursive: true });
  mkdirSync(join(root, ".okf", "bin"), { recursive: true });
  mkdirSync(join(root, ".okf", "config"), { recursive: true });
  mkdirSync(join(root, ".okf", "schema"), { recursive: true });
  mkdirSync(join(root, ".empty-hooks"));
  const binary = join(root, ".okf", "bin", "fake-droid");
  writeFileSync(binary, "#!/bin/sh\nexit 99\n");
  chmodSync(binary, 0o755);
  writeFileSync(join(root, ".okf", "KILL_SWITCH"), '{"active":false}\n');
  writeFileSync(join(root, ".okf", "templates", "scheduled-curation-prompt.md"), readFileSync(scheduledPrompt));
  writeFileSync(join(root, ".okf", "templates", "curation-prompt.md"), "# Fixture curation focus\n");
  writeFileSync(join(root, ".okf", "agents", "okf-curator.md"), "# Fixture curator contract\n");
  writeFileSync(join(root, ".okf", "schema", "okf-core-1.0.schema.json"), "{}\n");
  writeFileSync(join(root, "knowledge", "index.md"), "# Knowledge\n\n- [Decisions](./decisions/index.md)\n- [Inbox](./inbox/index.md)\n");
  writeFileSync(join(root, "knowledge", "decisions", "index.md"), "# Decisions\n");
  writeFileSync(join(root, "knowledge", "inbox", "index.md"), "# Inbox\n");
  writeFileSync(join(root, "knowledge", "log.md"), "# Log\n\n");
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["config", "core.hooksPath", ".empty-hooks"]);
  git(root, ["config", "user.email", "okf@example.test"]);
  git(root, ["config", "user.name", "OKF test"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "fixture base"]);
  const base = git(root, ["rev-parse", "HEAD"]);
  const sourcePath = "knowledge/inbox/2026-08-08T00-00-00Z-scheduled-fixture.md";
  writeFileSync(join(root, sourcePath), sessionItem(base));
  writeFileSync(join(root, "knowledge", "inbox", "index.md"), `# Inbox\n\n- [Scheduled fixture](./${sourcePath.split("/").at(-1)})\n`);
  const config = configFor(root, binary, options);
  const configPath = ".okf/config/scheduled.json";
  writeFileSync(join(root, configPath), `${JSON.stringify(config, null, 2)}\n`);
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "fixture capture and config"]);
  return {
    parent,
    root,
    binary,
    config,
    configPath,
    sourcePath,
    cleanup: () => rmSync(parent, { recursive: true, force: true }),
  };
}

function draftFor(fixture) {
  const revision = git(fixture.root, ["rev-parse", "HEAD"]);
  return {
    version: "okf-scheduled-curation-draft/1",
    outputs: [
      {
        path: "knowledge/log.md",
        content: `# Log\n\n## 2026-08-08 - Scheduled fixture\n\nRevision: ${revision}\n\nOutput: knowledge/decisions/scheduled-fixture-knowledge.md\n`,
      },
      {
        path: "knowledge/index.md",
        content: "# Knowledge\n\n- [Decisions](./decisions/index.md)\n- [Inbox](./inbox/index.md)\n",
      },
      {
        path: "knowledge/inbox/index.md",
        content: "# Inbox\n",
      },
      {
        path: "knowledge/decisions/index.md",
        content: "# Decisions\n\n- [Scheduled Fixture Knowledge](./scheduled-fixture-knowledge.md)\n",
      },
      {
        path: "knowledge/decisions/scheduled-fixture-knowledge.md",
        content: conceptText(),
      },
    ],
  };
}

function contextPackFromRequest(request) {
  const prompt = request.args.at(-1);
  const match = prompt.match(/<!-- OKF_CONTEXT_PACK_BEGIN -->\s*```json\s*([\s\S]*?)\s*```\s*<!-- OKF_CONTEXT_PACK_END -->/);
  assert.ok(match, "inline context pack marker is missing");
  return JSON.parse(match[1]);
}

function modelSuccess(fixture, calls, { assertContext = null } = {}) {
  return async (request) => {
    calls.push(request);
    assert.notEqual(request.cwd, fixture.root);
    assert.deepEqual(readdirSync(request.cwd), []);
    const contextPack = contextPackFromRequest(request);
    assert.ok(contextPack.documents.some(({ path }) => path === fixture.sourcePath));
    assertContext?.(contextPack, request);
    const raw = JSON.stringify(draftFor(fixture));
    return {
      status: 0,
      wall_ms: 5,
      stdout: JSON.stringify({ type: "result", is_error: false, duration_ms: 4, num_turns: 1, result: raw }),
      stderr: "",
    };
  };
}

function executorStub(fixture, calls, { unexpected = false } = {}) {
  return async (request) => {
    calls.push(request);
    const proposalPath = request.envelope[request.envelope.indexOf("--proposal") + 1];
    const proposalRaw = readFileSync(join(fixture.root, proposalPath));
    const proposal = JSON.parse(proposalRaw.toString("utf8"));
    if (request.mode === "check-only") {
      return {
        status: 0,
        wall_ms: 3,
        stdout: JSON.stringify({
          version: "okf-curation-dry-run/1",
          check_only: true,
          permitted: true,
          mutation: false,
          plan: { run_id: proposal.run_id, revision: proposal.revision, plan_hash: sha("fixture-plan") },
          proposal: { sha256: sha(proposalRaw), output_count: proposal.outputs.length },
        }),
      };
    }
    for (const output of proposal.outputs) {
      mkdirSync(dirname(join(fixture.root, output.path)), { recursive: true });
      writeFileSync(join(fixture.root, output.path), output.content);
    }
    const processed = join(fixture.root, "knowledge", "inbox", "processed", fixture.sourcePath.split("/").at(-1));
    renameSync(join(fixture.root, fixture.sourcePath), processed);
    if (unexpected) writeFileSync(join(fixture.root, "knowledge", "unexpected.md"), "unexpected\n");
    const reportPath = `.okf/reports/${proposal.run_id}.json`;
    const report = {
      version: "okf-run-report/1",
      outcome: "completed",
      run_id: proposal.run_id,
      root: fixture.root,
      revision: proposal.revision,
      changes: {
        proposed_outputs: proposal.outputs.map(({ path, content }) => ({ path, sha256: sha(content) })),
        applied_outputs: proposal.outputs
          .filter(({ content, expected_sha256: expectedHash, replaces_path: replacesPath }) => replacesPath || expectedHash !== sha(content))
          .map(({ path }) => path)
          .sort(),
        moved_items: [fixture.sourcePath],
        completed_items: [fixture.sourcePath],
        untouched_items: [],
      },
    };
    mkdirSync(dirname(join(fixture.root, reportPath)), { recursive: true });
    writeFileSync(join(fixture.root, reportPath), `${JSON.stringify(report, null, 2)}\n`);
    return { status: 0, wall_ms: 7, stdout: JSON.stringify({ outcome: "completed", report, report_path: reportPath }) };
  };
}

function gitDependency(calls) {
  return async ({ root, args }) => {
    calls.push([...args]);
    const result = spawnSync("git", args, { cwd: root, encoding: null });
    return { status: result.status, stdout: result.stdout ?? Buffer.alloc(0), stderr: result.stderr ?? Buffer.alloc(0) };
  };
}

function fixedClock() {
  let milliseconds = Date.parse("2026-08-08T00:00:00Z");
  return {
    now: () => (milliseconds += 1),
    nowIso: () => new Date(milliseconds += 1).toISOString(),
  };
}

await test("validates the strict closed profile and rejects placeholders", () => {
  const fixture = makeRepo();
  try {
    assert.equal(validateScheduledConfig(fixture.config, fixture.root).version, "okf-scheduled-curation/1");
    assert.throws(
      () => validateScheduledConfig({ ...fixture.config, generator: { ...fixture.config.generator, binary_sha256: "0".repeat(64) } }, fixture.root),
      (error) => error.code === "config-binary-hash-invalid",
    );
    assert.throws(
      () => validateScheduledConfig({ ...fixture.config, unknown: true }, fixture.root),
      (error) => error.code === "config-shape-invalid",
    );
  } finally { fixture.cleanup(); }
});

await test("subprocess environment excludes host secrets and execution overrides", () => {
  const environment = buildScheduledSubprocessEnv({
    HOME: "/safe/home",
    PATH: "/safe/bin",
    LANG: "en_AU.UTF-8",
    FACTORY_API_KEY: "secret",
    OPENAI_API_KEY: "secret",
    GIT_CONFIG_COUNT: "1",
    NODE_OPTIONS: "--require=/tmp/inject.js",
    SSH_AUTH_SOCK: "/tmp/agent.sock",
  });
  assert.deepEqual(environment, {
    HOME: "/safe/home",
    LANG: "en_AU.UTF-8",
    PATH: "/safe/bin",
  });
});

await test("runs one model session, identical serial curator envelopes, exact staging, and no push", async () => {
  const fixture = makeRepo();
  const modelCalls = [];
  const executorCalls = [];
  const gitCalls = [];
  try {
    const result = await runScheduledCuration({ root: fixture.root, configPath: fixture.configPath }, {
      ...fixedClock(),
      model: modelSuccess(fixture, modelCalls),
      executor: executorStub(fixture, executorCalls),
      git: gitDependency(gitCalls),
    });
    assert.equal(result.outcome, "completed", JSON.stringify(result));
    assert.equal(result.version, "okf-scheduled-curation-report/1");
    assert.equal(modelCalls.length, 1);
    assert.deepEqual(executorCalls.map(({ mode }) => mode), ["check-only", "execute"]);
    assert.deepEqual(executorCalls[0].envelope, executorCalls[1].envelope);
    assert.ok(!modelCalls[0].args.includes("--auto"));
    assert.ok(!modelCalls[0].args.includes("--mission"));
    assert.ok(!modelCalls[0].args.includes("--session-id"));
    assert.equal(modelCalls[0].args[modelCalls[0].args.indexOf("--enabled-tools") + 1], "TodoWrite");
    for (const forbidden of ["Read", "Grep", "Glob", "LS", "Execute", "FetchUrl", "WebSearch"]) {
      assert.ok(!modelCalls[0].args.includes(forbidden));
    }
    assert.equal(result.context.policy, "okf-selected-relevant-context/1");
    assert.ok(result.context.files > 0);
    assert.equal(result.context.manifest.length, result.context.files);
    assert.ok(result.context.source_bytes > 0);
    assert.ok(result.context.serialized_bytes > result.context.source_bytes);
    assert.ok(result.context.instruction_bytes > 0);
    assert.ok(result.context.prompt_bytes > 0);
    assert.equal(result.context.total_bytes, result.context.prompt_bytes);
    assert.ok(result.context.total_bytes <= fixture.config.limits.max_context_bytes);
    assert.equal(result.context.model_input_tokens, null);
    assert.doesNotMatch(JSON.stringify(result), /Use one bounded scheduled fixture\./);
    const add = gitCalls.find((args) => args[0] === "add");
    assert.deepEqual(add.slice(add.indexOf("--") + 1), result.changed_paths);
    assert.ok(!gitCalls.some((args) => args[0] === "push"));
    assert.match(git(fixture.root, ["log", "-1", "--format=%s"]), /^okf-curation:/);
    assert.equal(existsSync(join(fixture.root, ".okf", "scheduled-curation", "outer.lock")), false);
    const reportText = readFileSync(join(fixture.root, result.report_path), "utf8");
    assert.equal(JSON.parse(reportText).attempt_key, result.attempt_key);
    assert.equal(JSON.parse(readFileSync(join(fixture.root, ".okf", "scheduled-curation", "attempts", `${result.attempt_key}.json`), "utf8")).attempt_key, result.attempt_key);
    assert.equal(JSON.parse(readFileSync(join(fixture.root, result.proposal.path), "utf8")).run_id, result.run_id);
    assert.ok(!reportText.includes("Use one bounded fixture attempt."));
    assert.ok(!reportText.includes("Ready for fixture curation."));
  } finally { fixture.cleanup(); }
});

await test("one selected item cannot expand into multiple concept outputs", async () => {
  const fixture = makeRepo();
  let modelCalls = 0;
  let executorCalls = 0;
  try {
    const result = await runScheduledCuration({ root: fixture.root, configPath: fixture.configPath }, {
      ...fixedClock(),
      model: async () => {
        modelCalls += 1;
        const draft = draftFor(fixture);
        draft.outputs.push({
          path: "knowledge/process/second-concept.md",
          content: conceptText().replace("type: Decision", "type: Process").replace("Scheduled Fixture Knowledge", "Second Concept"),
        });
        const raw = JSON.stringify(draft);
        return {
          status: 0,
          wall_ms: 5,
          stdout: JSON.stringify({ type: "result", is_error: false, duration_ms: 4, num_turns: 1, result: raw }),
          stderr: "",
        };
      },
      executor: async () => { executorCalls += 1; throw new Error("unexpected"); },
    });
    assert.equal(result.outcome, "failed");
    assert.equal(result.reason, "model-concept-count-invalid");
    assert.equal(modelCalls, 1);
    assert.equal(executorCalls, 0);
  } finally { fixture.cleanup(); }
});

await test("maintenance outputs cannot smuggle concept replacements", async () => {
  const fixture = makeRepo();
  let executorCalls = 0;
  try {
    const result = await runScheduledCuration({ root: fixture.root, configPath: fixture.configPath }, {
      ...fixedClock(),
      model: async () => {
        const draft = draftFor(fixture);
        draft.outputs.find(({ path }) => path === "knowledge/log.md").replaces_path = "knowledge/decisions/fixture-related-concept.md";
        const raw = JSON.stringify(draft);
        return {
          status: 0,
          wall_ms: 5,
          stdout: JSON.stringify({ type: "result", is_error: false, duration_ms: 4, num_turns: 1, result: raw }),
          stderr: "",
        };
      },
      executor: async () => { executorCalls += 1; throw new Error("unexpected"); },
    });
    assert.equal(result.outcome, "failed");
    assert.equal(result.reason, "model-replacement-invalid");
    assert.equal(executorCalls, 0);
  } finally { fixture.cleanup(); }
});

await test("durable success report exists before the outer lease can be released", async () => {
  const fixture = makeRepo();
  const modelCalls = [];
  const executorCalls = [];
  try {
    const result = await runScheduledCuration({ root: fixture.root, configPath: fixture.configPath }, {
      ...fixedClock(),
      model: modelSuccess(fixture, modelCalls),
      executor: executorStub(fixture, executorCalls),
      afterSuccessReport: ({ root, lease, reportPath }) => {
        assert.equal(JSON.parse(readFileSync(join(root, reportPath), "utf8")).outcome, "completed");
        assert.equal(JSON.parse(readFileSync(join(root, ".okf", "scheduled-curation", "outer.lock"), "utf8")).attempt_key, lease.attempt_key);
        const error = new Error("simulated crash gap");
        error.code = "simulated-crash-gap";
        throw error;
      },
    });
    assert.equal(result.outcome, "failed");
    assert.equal(result.reason, "simulated-crash-gap");
    assert.equal(modelCalls.length, 1);
    assert.equal(executorCalls.length, 2);
    assert.equal(existsSync(join(fixture.root, ".okf", "scheduled-curation", "outer.lock")), true);
    assert.equal(JSON.parse(readFileSync(join(fixture.root, ".okf", "KILL_SWITCH"), "utf8")).active, true);
  } finally { fixture.cleanup(); }
});

await test("disabled configuration performs no model, executor, lease, commit, or kill action", async () => {
  const fixture = makeRepo({ enabled: false });
  let modelCalls = 0;
  let executorCalls = 0;
  try {
    const before = git(fixture.root, ["rev-parse", "HEAD"]);
    const result = await runScheduledCuration({ root: fixture.root, configPath: fixture.configPath }, {
      ...fixedClock(),
      model: async () => { modelCalls += 1; throw new Error("unexpected"); },
      executor: async () => { executorCalls += 1; throw new Error("unexpected"); },
    });
    assert.equal(result.outcome, "disabled");
    assert.equal(modelCalls, 0);
    assert.equal(executorCalls, 0);
    assert.equal(git(fixture.root, ["rev-parse", "HEAD"]), before);
    assert.equal(readFileSync(join(fixture.root, ".okf", "KILL_SWITCH"), "utf8"), '{"active":false}\n');
    assert.equal(existsSync(join(fixture.root, ".okf", "scheduled-curation")), false);
  } finally { fixture.cleanup(); }
});

await test("an empty actionable set is a no-action result without a session or lease", async () => {
  const fixture = makeRepo();
  let modelCalls = 0;
  try {
    git(fixture.root, ["rm", "-q", fixture.sourcePath]);
    writeFileSync(join(fixture.root, "knowledge", "inbox", "index.md"), "# Inbox\n");
    git(fixture.root, ["add", "knowledge/inbox/index.md"]);
    git(fixture.root, ["commit", "-qm", "empty fixture inbox"]);
    const result = await runScheduledCuration({ root: fixture.root, configPath: fixture.configPath }, {
      ...fixedClock(),
      model: async () => { modelCalls += 1; throw new Error("unexpected"); },
    });
    assert.equal(result.outcome, "no-action");
    assert.equal(modelCalls, 0);
    assert.equal(existsSync(join(fixture.root, ".okf", "scheduled-curation")), false);
    assert.equal(readFileSync(join(fixture.root, ".okf", "KILL_SWITCH"), "utf8"), '{"active":false}\n');
  } finally { fixture.cleanup(); }
});

await test("inline context contains only selected, maintenance, catalog, and relevant concept content", async () => {
  const fixture = makeRepo();
  let modelCalls = 0;
  let modelRoot = null;
  try {
    writeFileSync(join(fixture.root, "knowledge", "viz.html"), "v".repeat(300 * 1024));
    writeFileSync(join(fixture.root, "knowledge", "viewer.html"), "viewer\n");
    writeFileSync(join(fixture.root, "knowledge", "generate-viz.js"), "generator\n");
    writeFileSync(join(fixture.root, "knowledge", "okf-query.sh"), "query\n");
    writeFileSync(join(fixture.root, "knowledge", ".DS_Store"), "metadata\n");
    writeFileSync(join(fixture.root, "knowledge", "unrelated-root.md"), "unrelated root Markdown\n");
    writeFileSync(join(fixture.root, "knowledge", "inbox", "zz-unselected.md"), "unselected pending record\n");
    writeFileSync(join(fixture.root, "knowledge", "inbox", "processed", "old-record.md"), "processed raw record\n");
    writeFileSync(join(fixture.root, "knowledge", "decisions", "matching-fixture.md"), `---
type: Decision
title: Bounded Scheduled Fixture
description: Relevant bounded fixture safety decision
tags: [bounded, fixture, safety]
---

MATCHED-BODY-SENTINEL
`);
    writeFileSync(join(fixture.root, "knowledge", "process", "unmatched-payments.md"), `---
type: Process
title: Payment Reconciliation
description: A finance ledger procedure
tags: [finance, payments, okf, curation]
---

UNMATCHED-BODY-SENTINEL
`);
    git(fixture.root, ["add", "knowledge"]);
    git(fixture.root, ["commit", "-qm", "add context boundary fixtures"]);
    const firstPreview = inspectScheduledContext(fixture.root, fixture.sourcePath);
    const secondPreview = inspectScheduledContext(fixture.root, fixture.sourcePath);
    assert.deepEqual(firstPreview, secondPreview);
    assert.ok(firstPreview.maximum_total_bytes <= fixture.config.limits.max_context_bytes);
    assert.ok(firstPreview.manifest.some(({ path, role }) => path === "knowledge/decisions/matching-fixture.md" && role === "relevant-concept"));
    assert.ok(!firstPreview.manifest.some(({ path }) => path === "knowledge/process/unmatched-payments.md"));
    const result = await runScheduledCuration({ root: fixture.root, configPath: fixture.configPath }, {
      ...fixedClock(),
      model: async (request) => {
        modelCalls += 1;
        modelRoot = request.cwd;
        assert.deepEqual(readdirSync(request.cwd), []);
        const contextPack = contextPackFromRequest(request);
        const paths = new Set(contextPack.documents.map(({ path }) => path));
        for (const required of [
          fixture.sourcePath,
          "knowledge/index.md",
          "knowledge/log.md",
          "knowledge/inbox/index.md",
          "knowledge/decisions/index.md",
          ".okf/templates/curation-prompt.md",
          ".okf/schema/okf-core-1.0.schema.json",
          ".okf/context/concept-catalog.json",
          "knowledge/decisions/matching-fixture.md",
        ]) assert.ok(paths.has(required), required);
        for (const excluded of [
          "knowledge/viz.html",
          "knowledge/viewer.html",
          "knowledge/generate-viz.js",
          "knowledge/okf-query.sh",
          "knowledge/.DS_Store",
          "knowledge/unrelated-root.md",
          "knowledge/inbox/zz-unselected.md",
          "knowledge/inbox/processed/old-record.md",
          "knowledge/process/unmatched-payments.md",
          fixture.configPath,
          ".okf/agents/okf-curator.md",
          ".okf/templates/scheduled-curation-prompt.md",
        ]) assert.equal(paths.has(excluded), false, excluded);
        const prompt = request.args.at(-1);
        assert.match(prompt, /MATCHED-BODY-SENTINEL/);
        assert.doesNotMatch(prompt, /UNMATCHED-BODY-SENTINEL|unselected pending record|processed raw record|v{100}/);
        const catalogDocument = contextPack.documents.find(({ path }) => path === ".okf/context/concept-catalog.json");
        const catalog = JSON.parse(catalogDocument.content);
        assert.ok(catalog.concepts.some(({ path }) => path === "knowledge/process/unmatched-payments.md"));
        return { status: 1, timed_out: true, code: "command-timeout", wall_ms: 10_001, stdout: "", stderr: "" };
      },
    });
    assert.equal(result.outcome, "failed");
    assert.equal(result.reason, "model-timeout");
    assert.equal(modelCalls, 1);
    assert.equal(existsSync(modelRoot), false);
    assert.ok(result.context.total_bytes < fixture.config.limits.max_context_bytes);
  } finally { fixture.cleanup(); }
});

await test("ambiguous relevant-concept cutoff fails before Droid instead of widening context", async () => {
  const fixture = makeRepo();
  let modelCalls = 0;
  try {
    for (let index = 0; index < 13; index += 1) {
      writeFileSync(join(fixture.root, "knowledge", "decisions", `tied-${String(index).padStart(2, "0")}.md`), `---
type: Decision
title: Bounded Scheduled Fixture Signal
description: Relevant bounded fixture safety signal
tags: [bounded, fixture, safety]
---

Same relevance score.
`);
    }
    git(fixture.root, ["add", "knowledge/decisions"]);
    git(fixture.root, ["commit", "-qm", "add ambiguous relevance fixtures"]);
    const result = await runScheduledCuration({ root: fixture.root, configPath: fixture.configPath }, {
      ...fixedClock(),
      model: async () => { modelCalls += 1; throw new Error("unexpected"); },
    });
    assert.equal(result.outcome, "failed");
    assert.equal(result.reason, "context-relevance-ambiguous");
    assert.equal(modelCalls, 0);
    assert.equal(JSON.parse(readFileSync(join(fixture.root, ".okf", "KILL_SWITCH"), "utf8")).active, true);
  } finally { fixture.cleanup(); }
});

await test("inline prompt context cap stops before the model and activates the kill switch", async () => {
  const fixture = makeRepo();
  let modelCalls = 0;
  try {
    writeFileSync(join(fixture.root, "knowledge", "log.md"), `# Log\n\n${"x".repeat(260 * 1024)}`);
    git(fixture.root, ["add", "knowledge/log.md"]);
    git(fixture.root, ["commit", "-qm", "large committed context fixture"]);
    const result = await runScheduledCuration({ root: fixture.root, configPath: fixture.configPath }, {
      ...fixedClock(),
      model: async () => { modelCalls += 1; throw new Error("unexpected"); },
    });
    assert.equal(result.outcome, "failed");
    assert.equal(result.reason, "model-context-exceeded");
    assert.equal(modelCalls, 0);
    assert.equal(JSON.parse(readFileSync(join(fixture.root, ".okf", "KILL_SWITCH"), "utf8")).active, true);
  } finally { fixture.cleanup(); }
});

await test("model timeout activates the kill switch, retains the outer lease, and never retries", async () => {
  const fixture = makeRepo();
  let modelCalls = 0;
  const timedOut = async () => {
    modelCalls += 1;
    return { status: 1, timed_out: true, code: "command-timeout", wall_ms: 10_001, stdout: "", stderr: "" };
  };
  try {
    const first = await runScheduledCuration({ root: fixture.root, configPath: fixture.configPath }, { ...fixedClock(), model: timedOut });
    assert.equal(first.outcome, "failed");
    assert.equal(first.reason, "model-timeout");
    assert.equal(modelCalls, 1);
    assert.equal(JSON.parse(readFileSync(join(fixture.root, ".okf", "KILL_SWITCH"), "utf8")).active, true);
    assert.equal(existsSync(join(fixture.root, ".okf", "scheduled-curation", "outer.lock")), true);
    assert.equal(JSON.parse(readFileSync(join(fixture.root, ".okf", "scheduled-curation", "outer.lock"), "utf8")).attempt_key, first.attempt_key);
    const second = await runScheduledCuration({ root: fixture.root, configPath: fixture.configPath }, { ...fixedClock(), model: timedOut });
    assert.equal(second.outcome, "failed");
    assert.equal(modelCalls, 1);
  } finally { fixture.cleanup(); }
});

await test("unexpected knowledge diff stops before staging and activates the kill switch", async () => {
  const fixture = makeRepo();
  const modelCalls = [];
  const executorCalls = [];
  const gitCalls = [];
  try {
    const result = await runScheduledCuration({ root: fixture.root, configPath: fixture.configPath }, {
      ...fixedClock(),
      model: modelSuccess(fixture, modelCalls),
      executor: executorStub(fixture, executorCalls, { unexpected: true }),
      git: gitDependency(gitCalls),
    });
    assert.equal(result.outcome, "failed");
    assert.equal(result.reason, "unexpected-knowledge-diff");
    assert.equal(modelCalls.length, 1);
    assert.ok(!gitCalls.some((args) => args[0] === "add" || args[0] === "commit"));
    assert.equal(JSON.parse(readFileSync(join(fixture.root, ".okf", "KILL_SWITCH"), "utf8")).active, true);
  } finally { fixture.cleanup(); }
});

await test("approved unrelated dirty work is absent from inline context and byte-identical after commit", async () => {
  const fixture = makeRepo({ allowUnrelated: true });
  const modelCalls = [];
  const executorCalls = [];
  const gitCalls = [];
  try {
    writeFileSync(join(fixture.root, "unrelated.txt"), "tracked base\n");
    git(fixture.root, ["add", "unrelated.txt"]);
    git(fixture.root, ["commit", "-qm", "add unrelated fixture"]);
    writeFileSync(join(fixture.root, "unrelated.txt"), "operator dirty work\n");
    const before = readFileSync(join(fixture.root, "unrelated.txt"), "utf8");
    const result = await runScheduledCuration({ root: fixture.root, configPath: fixture.configPath }, {
      ...fixedClock(),
      model: modelSuccess(fixture, modelCalls),
      executor: executorStub(fixture, executorCalls),
      git: gitDependency(gitCalls),
    });
    assert.equal(result.outcome, "completed", JSON.stringify(result));
    assert.equal(readFileSync(join(fixture.root, "unrelated.txt"), "utf8"), before);
    assert.equal(git(fixture.root, ["status", "--short", "--", "unrelated.txt"]), "M unrelated.txt");
  } finally { fixture.cleanup(); }
});

if (failures > 0) {
  console.error(`\n${failures} scheduled curation test(s) failed.`);
  process.exit(1);
}
console.log("\nAll scheduled curation tests passed.");
