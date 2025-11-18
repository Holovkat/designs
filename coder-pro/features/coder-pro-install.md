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

## 3. Install Runtime Dependencies
The CLI dynamically `import`s `tiktoken`. Install it globally:
```bash
npm install -g tiktoken
```
(Installing the scoped `@dqbd/tiktoken` package does **not** satisfy this requirement; the CLI resolves the unscoped name.)

## 4. Deploy the Binary (Recommended Method)

### 4.1. Extract and Install to User Local Directory
This approach avoids npm cache permission issues and works reliably:

```bash
# Extract the package
cd /tmp && tar -xzf /Users/tonyholovka/workspace/coder-pro/qwen-code-qwen-code-0.2.2.tgz

# Create user local bin directory
mkdir -p ~/.local/bin

# Copy the binary
cp /tmp/package/dist/cli.js ~/.local/bin/coder-pro-binary

# Create a wrapper script to handle NODE_PATH
cat > ~/.local/bin/coder-pro << 'EOF'
#!/bin/bash
export NODE_PATH="/Users/tonyholovka/.nvm/versions/node/v20.19.2/lib/node_modules:$NODE_PATH"
exec /Users/tonyholovka/.local/bin/coder-pro-binary "$@"
EOF

# Make both executable
chmod +x ~/.local/bin/coder-pro-binary
chmod +x ~/.local/bin/coder-pro

# Create symlink for tiktoken in local bin
mkdir -p ~/.local/bin/node_modules
ln -sf /Users/tonyholovka/.nvm/versions/node/v20.19.2/lib/node_modules/tiktoken ~/.local/bin/node_modules/tiktoken

# Add to PATH if not already there
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
```

### 4.2. Alternative: Global npm Install (May Have Permission Issues)
```bash
npm install -g /Users/tonyholovka/workspace/coder-pro/qwen-code-qwen-code-0.2.2.tgz
```
⚠️ **Note**: This method often encounters npm cache permission issues on macOS. The user local directory method above is preferred.

## 5. Verification
```bash
source ~/.zshrc  # Reload shell configuration
coder-pro --version   # expect 0.2.2
coder-pro --help      # confirm CLI banner renders
```
Optionally run an interactive smoke test: `coder-pro /help`.

## 6. Updating to a New Build
Repeat steps 2–4 with the new `npm pack` tarball. The wrapper script automatically handles NODE_PATH, so only the binary needs to be updated.

## 7. Deployment Architecture

### 7.1. File Structure
```
~/.local/bin/
├── coder-pro-binary          # The actual CLI binary
├── coder-pro                # Wrapper script that sets NODE_PATH
└── node_modules/
    └── tiktoken -> ~/.nvm/versions/node/v20.19.2/lib/node_modules/tiktoken
```

### 7.2. Wrapper Script Purpose
The wrapper script (`~/.local/bin/coder-pro`) handles:
1. **NODE_PATH Setup**: Ensures the binary can find the `tiktoken` dependency
2. **Binary Execution**: Calls the actual binary with all passed arguments
3. **Environment Isolation**: Prevents conflicts with system-wide npm installations

### 7.3. Benefits of This Approach
- ✅ **No sudo required**: Everything installs in user directory
- ✅ **No npm cache issues**: Bypasses global npm permission problems
- ✅ **Clean separation**: `coder-pro` and `qwen` remain independent
- ✅ **Easy updates**: Only need to update the binary file
- ✅ **Portable**: Works across different Node versions and npm configurations

## 8. Troubleshooting

### 8.1. Common Issues
| Issue | Solution |
|-------|----------|
| `coder-pro: command not found` | Run `source ~/.zshrc` or restart terminal |
| `Cannot find package 'tiktoken'` | Ensure the tiktoken symlink exists: `ls -la ~/.local/bin/node_modules/tiktoken` |
| Permission denied errors | Use the user local directory method (section 4.1) instead of global npm install |
| Binary not updating | Make sure to copy the new `cli.js` to `coder-pro-binary`, not the wrapper |

### 8.2. Verification Commands
```bash
# Check if wrapper is working
~/.local/bin/coder-pro --version

# Check if binary can find tiktoken
NODE_PATH="/Users/tonyholovka/.nvm/versions/node/v20.19.2/lib/node_modules" node ~/.local/bin/coder-pro-binary --version

# Verify file structure
ls -la ~/.local/bin/
```
