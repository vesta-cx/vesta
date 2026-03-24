#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REFERENCES_DIR="$REPO_ROOT/.references"

setup_reference() {
	local name="$1"
	local remote_url="$2"
	local upstream_ref="$3"
	local local_branch="$4"

	local bare_repo_dir="$REFERENCES_DIR/$name.git"
	local worktree_dir="$REFERENCES_DIR/$name"

	if [ ! -d "$bare_repo_dir" ]; then
		git clone --bare "$remote_url" "$bare_repo_dir"
	else
		git --git-dir="$bare_repo_dir" fetch origin --prune
	fi

	if [ -e "$worktree_dir" ]; then
		git --git-dir="$bare_repo_dir" worktree remove --force "$worktree_dir" 2>/dev/null || rm -rf "$worktree_dir"
	fi

	git --git-dir="$bare_repo_dir" worktree prune
	git --git-dir="$bare_repo_dir" worktree add -B "$local_branch" "$worktree_dir" "$upstream_ref"
	git -C "$worktree_dir" rev-parse HEAD
}

mkdir -p "$REFERENCES_DIR"

setup_reference "workos-node" "https://github.com/workos/workos-node.git" "main" "workos-node-reference"
setup_reference "hono" "https://github.com/honojs/hono.git" "main" "hono-reference"
setup_reference "sveltekit" "https://github.com/sveltejs/kit.git" "main" "sveltekit-reference"
setup_reference "drizzle-orm" "https://github.com/drizzle-team/drizzle-orm.git" "main" "drizzle-orm-reference"
