#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REFERENCES_DIR="$REPO_ROOT/.references"

setup_reference() {
	local name="$1"
	local remote_url="$2"
	local upstream_ref="$3"
	local pinned_commit="$4"

	local bare_repo_dir="$REFERENCES_DIR/$name.git"
	local worktree_dir="$REFERENCES_DIR/$name"

	if [ ! -d "$bare_repo_dir" ]; then
		git clone --bare "$remote_url" "$bare_repo_dir"
	else
		git --git-dir="$bare_repo_dir" fetch origin "$upstream_ref" --prune
	fi

	if [ -e "$worktree_dir" ]; then
		git --git-dir="$bare_repo_dir" worktree remove --force "$worktree_dir" 2>/dev/null || rm -rf "$worktree_dir"
	fi

	git --git-dir="$bare_repo_dir" worktree prune
	git --git-dir="$bare_repo_dir" worktree add --detach "$worktree_dir" "$pinned_commit"
	git -C "$worktree_dir" rev-parse HEAD
}

mkdir -p "$REFERENCES_DIR"

setup_reference "workos-node" "https://github.com/workos/workos-node.git" "main" "5e52f6c72b503873f92b57b941e6b587d6e1c872"
setup_reference "hono" "https://github.com/honojs/hono.git" "main" "e1ae0eb0f5a2dc1001895523016db02141972695"
setup_reference "sveltekit" "https://github.com/sveltejs/kit.git" "main" "9de9b2c1da11355f91f767022a3f1d9a221c7650"
setup_reference "drizzle-orm" "https://github.com/drizzle-team/drizzle-orm.git" "main" "4aa6ecfee4b4728dadf6f77f071a149878a3c6c0"
