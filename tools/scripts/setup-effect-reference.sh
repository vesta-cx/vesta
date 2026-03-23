#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REFERENCES_DIR="$REPO_ROOT/.references"
BARE_REPO_DIR="$REFERENCES_DIR/effect-smol.git"
WORKTREE_DIR="$REFERENCES_DIR/effect-v4-beta"
REMOTE_URL="https://github.com/Effect-TS/effect-smol.git"
UPSTREAM_REF="main"
LOCAL_BRANCH="effect-v4-beta-reference"

mkdir -p "$REFERENCES_DIR"

if [ ! -d "$BARE_REPO_DIR" ]; then
  git clone --bare "$REMOTE_URL" "$BARE_REPO_DIR"
else
  git --git-dir="$BARE_REPO_DIR" fetch origin --prune
fi

if [ -e "$WORKTREE_DIR" ]; then
  git --git-dir="$BARE_REPO_DIR" worktree remove --force "$WORKTREE_DIR" 2>/dev/null || rm -rf "$WORKTREE_DIR"
fi

git --git-dir="$BARE_REPO_DIR" worktree prune
git --git-dir="$BARE_REPO_DIR" worktree add -B "$LOCAL_BRANCH" "$WORKTREE_DIR" "$UPSTREAM_REF"

git -C "$WORKTREE_DIR" rev-parse HEAD
