# GitHub Alignment System Prompt: z.ai Provider Integration

You need to align the remote repository with the z.ai provider tenant extraction changes. Follow this Graphite-style stacking workflow.

## Current Changes to Align
- **Tenant Auto-Extraction**: z.ai providers now extract tenant ID from API key format `tenantId.secretKey`
- **Removed Manual Tenant**: No longer need to configure `extraHeaders: { "tenant": "83005" }`
- **Updated AppContainer**: Modified `applyProviderRuntimeConfig` to automatically inject tenant header
- **Updated ProviderTemplates**: Removed static tenant configuration from z.ai template
- **Updated TFD**: Documented changes in technical requirements document
- **Updated Installation Guide**: Added deployment instructions and troubleshooting
- **Build Success**: All tests pass, build completes without errors

## PR Stack for z.ai Provider Integration

### Part 1: Implement Tenant Auto-Extraction
**Branch**: `feature/1-zai-tenant-extraction`

**This PR:** Implements automatic tenant ID extraction from z.ai API keys

**Changes:**
- Modified `packages/cli/src/ui/AppContainer.tsx` to extract tenant ID from API key format `tenantId.secretKey`
- Updated `applyProviderRuntimeConfig` to automatically inject tenant header for z.ai providers
- Removed static tenant configuration from `packages/cli/src/coder-pro/providers/ProviderTemplates.ts` z.ai template
- Added tenant extraction logic with proper error handling

**Implementation Details:**
- **Files Modified:** 
  - `packages/cli/src/ui/AppContainer.tsx` - Added tenant extraction logic in `applyProviderRuntimeConfig`
  - `packages/cli/src/coder-pro/providers/ProviderTemplates.ts` - Removed static `extraHeaders: { tenant: "83005" }` from z.ai template
- **packages/cli/src/coder-pro/providers/ProviderTypes.ts` - No changes (interface remains compatible)
- **packages/cli/src/coder-pro/dialogs/CoderProProviderWizard.test.tsx` - No changes (tests still pass)
- **packages/cli/src/ui/AppContainer.test.tsx` - No changes (tests still pass)

- **API Changes:** 
  - Modified runtime provider configuration to automatically extract tenant ID from API key
  - Tenant header is now injected dynamically for z.ai providers
  - No breaking changes to existing provider interfaces

- **Breaking Changes:** 
  - Manual tenant configuration is no longer supported for z.ai providers
  - Users must use API key format `tenantId.secretKey` (e.g., `a1b2c3d4e5.f6g7h8i9j0`)

- **Migration Steps:** 
  - Existing z.ai provider configurations will automatically work on next run
  - No manual migration required - tenant extraction is backward compatible
  - Users with custom tenant headers should remove them and rely on API key format

**Stack:**
- Previous: None (base of stack)
- Next: #2 (feature/2-update-docs)

**Testing:**
- Verify z.ai provider works with API key format `a1b2c3d4e5.f6g7h8i9j0`
- Confirm tenant header `a1b2c3d4e5` is automatically injected
- Test that manual tenant configuration is no longer required
- Run existing test suite to ensure no regressions
- Test with various API key formats (single part, multiple dots)

---

### Part 2: Update Documentation
**Branch**: `feature/2-update-docs`

**This PR:** Updates technical documentation to reflect tenant auto-extraction

**Changes:**
- Updated `designs/coder-pro/features/zai-provider-integration-tfd.md` with new implementation details
- Removed manual tenant header requirements from sample configurations
- Added API integration section explaining automatic tenant extraction
- Updated `designs/coder-pro/features/coder-pro-install.md` with deployment instructions
- Added troubleshooting section for tenant extraction issues
- Updated version to 0.2.0 and last updated date

**Implementation Details:**
- **Files Modified:** 
  - `designs/coder-pro/features/zai-provider-integration-tfd.md` - Added tenant extraction implementation section
  - `designs/coder-pro/features/coder-pro-install.md` - Added user local deployment method
  - `designs/coder-pro/instructions/github-alignment-system-prompt-zai-provider-alignment.md` - Created this alignment prompt

- **Documentation Changes:** 
  - Sample configurations now show API key format without tenant headers
  - API integration section explains automatic tenant injection
  - Installation guide includes troubleshooting for npm cache issues

- **Breaking Changes:** None - documentation updates only

**Stack:**
- Previous: #1 (feature/1-zai-tenant-extraction)
- Next: #3 (feature/3-cleanup-tests)

**Testing:**
- Verify documentation accurately reflects implementation
- Test installation guide instructions
- Confirm sample configurations work with new approach
- Validate that all references to manual tenant setup are removed

---

### Part 3: Cleanup and Tests
**Branch**: `feature/3-cleanup-tests`

**This PR:** Final cleanup and test validation

**Changes:**
- Remove any remaining references to manual tenant configuration
- Add unit tests for tenant extraction logic
- Update integration tests for z.ai provider
- Clean up any TODO comments or temporary code
- Ensure build passes with new changes

**Implementation Details:**
- **Files Modified:** 
  - Potential new test files for tenant extraction
  - Updated existing integration tests to cover new functionality
  - Code cleanup in AppContainer.tsx if needed

- **Testing:** 
  - Unit tests for tenant extraction with various API key formats
  - Integration tests for z.ai provider functionality
  - Manual verification of z.ai provider with different API key formats
  - Performance testing to ensure no regression in tenant extraction

**Stack:**
- Previous: #2 (feature/2-update-docs)
- Next: None (top of stack)

**Testing:**
- Full test suite execution
- Manual verification of z.ai provider functionality
- Performance testing with various API key formats
- Documentation review for accuracy and completeness

---

## PR Description Template

```
## Part X of Y: [Title]

**This PR:** What this specific change does

**Stack:**
- Previous: #123 (description)
- Next: #125 (description)

**Implementation Details:**
- **Files Modified:** List key files changed
- **API Changes:** Describe any interface changes
- **Breaking Changes:** Note any breaking changes
- **Migration Steps:** If needed, explain how to migrate

**Testing:**
- **Unit Tests:** Which tests were added/updated
- **Integration Tests:** How end-to-end functionality was verified
- **Manual Testing:** Steps to manually verify the changes

**Documentation:**
- **TFD Updates:** Reference any technical requirements documents updated
- **User Guide:** Link to user-facing documentation changes
- **API Docs:** Note any API documentation updates

**Verification Checklist:**
- [ ] Build passes without errors
- [ ] All tests pass
- [ ] Documentation is accurate
- [ ] No breaking changes without proper migration
- [ ] Performance is acceptable
```

## Alignment Commands

**Initial Setup:**
```bash
# Ensure main is up to date
git checkout main && git pull

# Create first feature branch
git checkout -b feature/1-zai-tenant-extraction
```

**Daily Sync Routine:**
```bash
# Sync stack with main
git checkout main && git pull
git checkout feature/1-zai-tenant-extraction && git rebase main && git push --force-with-lease
git checkout feature/2-update-docs && git rebase feature/1-zai-tenant-extraction && git push --force-with-lease
git checkout feature/3-cleanup-tests && git rebase feature/2-update-docs && git push --force-with-lease
```

**Updating middle branch:**
```bash
git checkout feature/1-zai-tenant-extraction
# make changes, commit
git push --force-with-lease
# rebase all dependent branches
git checkout feature/2-update-docs && git rebase feature/1-zai-tenant-extraction && git push --force-with-lease
git checkout feature/3-cleanup-tests && git rebase feature/2-update-docs && git push --force-with-lease
```

**After PR1 merges:**
```bash
git checkout main && git pull
git checkout feature/2-update-docs && git rebase main && git push --force-with-lease
# Update PR2 base to main on GitHub
```

## Key Files Modified

### Core Implementation
- `packages/cli/src/ui/AppContainer.tsx` - Tenant extraction logic
- `packages/cli/src/coder-pro/providers/ProviderTemplates.ts` - Remove static tenant

### Documentation
- `designs/coder-pro/features/zai-provider-integration-tfd.md` - Technical requirements
- `designs/coder-pro/features/coder-pro-install.md` - Installation guide
- `designs/coder-pro/instructions/github-alignment-system-prompt-zai-provider-alignment.md` - This alignment prompt

### Tests
- `packages/cli/src/coder-pro/dialogs/CoderProProviderWizard.test.tsx` - Provider tests
- `packages/cli/src/ui/AppContainer.test.tsx` - Container tests
- `integration-tests/` - End-to-end provider tests

## Success Criteria
- [x] Tenant ID automatically extracted from API key format `tenantId.secretKey`
- [x] No manual tenant configuration required
- [x] All existing tests pass
- [x] Documentation updated to reflect changes
- [x] Build process completes without errors
- [x] Installation guide tested and verified

## Usage Instructions

### Step 1: Initial Setup
```bash
# Ensure main is up to date
git checkout main && git pull

# Create first feature branch
git checkout -b feature/1-zai-tenant-extraction
```

### Step 2: Implement Changes
```bash
# Make your changes in AppContainer.tsx and ProviderTemplates.ts
# Commit and push
git add .
git commit -m "feat: implement tenant auto-extraction for z.ai providers"
git push --force-with-lease
```

### Step 3: Update Documentation
```bash
# Update TFD and installation guide
git add designs/coder-pro/features/zai-provider-integration-tfd.md
git add designs/coder-pro/features/coder-pro-install.md
git commit -m "docs: update documentation for tenant auto-extraction"
git push --force-with-lease
```

### Step 4: Sync Stack
```bash
# Sync with main and update dependent branches
git checkout main && git pull
git checkout feature/1-zai-tenant-extraction && git rebase main && git push --force-with-lease
```

### Step 5: Create Documentation PR
```bash
# Create documentation update branch
git checkout -b feature/2-update-docs
git push --force-with-lease
```

### Step 6: Final Tests and Cleanup
```bash
# Create final test branch
git checkout -b feature/3-cleanup-tests
git push --force-with-lease
```

### Step 7: Create PRs
- Create PR for Part 1: Implementation
- Create PR for Part 2: Documentation  
- Create PR for Part 3: Tests
- Mark Parts 2 and 3 as draft until Part 1 is approved
- Set PR 2 to target Part 1 after merge
- Set PR 3 to target Part 2 after merge

## Key Points for This Alignment
- **Focus**: Tenant extraction from API key format `tenantId.secretKey`
- **Breaking Change**: Manual tenant configuration no longer supported
- **User Impact**: Simplified z.ai provider setup
- **Testing**: Comprehensive test coverage for extraction logic
- **Documentation**: Updated to reflect new approach