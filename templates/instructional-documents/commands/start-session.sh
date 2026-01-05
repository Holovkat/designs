#!/usr/bin/env bash
set -euo pipefail

branch_name="$1"

if [ -z "$branch_name" ]; then
  echo "Error: Please provide a branch name"
  echo "Usage: /start-session <branch-name>"
  exit 1
fi

# Create and checkout the new branch
git checkout -b "$branch_name"

echo "Created and switched to branch: $branch_name"
echo "Ready to start coding session!"
