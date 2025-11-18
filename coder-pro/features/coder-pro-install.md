# Coder-Pro CLI Installation Guide

These steps install the custom `coder-pro` binary system-wide using the sources in `/Users/tonyholovka/workspace/coder-pro`.

## 1. Prerequisites
- Node.js **20.19.2** via `nvm` (the published artifacts assume this runtime).
- `npm` (ships with Node 20).
- Local checkout at `/Users/tonyholovka/workspace/coder-pro`.

Activate the matching Node:
```bash
source ~/.nvm/nvm.sh
nvm use v20.19.2
```

## 2. Build & Package the CLI
From the repo root:
```bash
npm install       # only if dependencies changed
npm run build     # compiles all packages
npm pack          # emits qwen-code-qwen-code-<version>.tgz in the repo root
```
The current release bundle is `qwen-code-qwen-code-0.2.2.tgz`.

## 3. Install Globally Under NVM
Still using Node 20.19.2:
```bash
npm install -g /Users/tonyholovka/workspace/coder-pro/qwen-code-qwen-code-0.2.2.tgz
```
This registers the package under `~/.nvm/versions/node/v20.19.2/lib/node_modules/@qwen-code/qwen-code` and exposes the stock `qwen` binary inside `~/.nvm/versions/node/v20.19.2/bin/`.

## 4. Provide a `coder-pro` Launcher
Create a dedicated shim that points at the installed CLI (adjust the path if your global prefix differs):
```bash
ln -sf ~/.nvm/versions/node/v20.19.2/bin/qwen /usr/local/bin/coder-pro
```
Now `coder-pro` and `qwen` both launch the same CLI build.

## 5. Fulfill Runtime Dependencies
The CLI dynamically `import`s `tiktoken`. Install it globally within the same prefix:
```bash
npm install -g tiktoken
```
(Installing the scoped `@dqbd/tiktoken` package does **not** satisfy this requirement; the CLI resolves the unscoped name.)

## 6. Verification
```bash
coder-pro --version   # expect 0.2.2
coder-pro --help      # confirm CLI banner renders
```
Optionally run an interactive smoke test: `coder-pro /help`.

## 7. Updating to a New Build
Repeat steps 2–6 with the new `npm pack` tarball. Re-link the shim if the global prefix or Node version changes.```],
