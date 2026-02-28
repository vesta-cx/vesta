# Plan: Subtree push script and `.gittrees`

## Goal

After flattening submodules into the monorepo with `git subtree add`, provide a script that:

1. Runs normal `git push` with any passed arguments.
2. If a `.gittrees` file exists at the **monorepo root**, also pushes each listed subtree to its respective remote (`git subtree push --prefix=… …`).

Script must work from **any working directory** (resolve monorepo root first). If no `.gittrees` is present, only (1) runs.

---

## `.gittrees` format (TOML)

Same logical structure as `.gitmodules`: path, remote-name (not url), branch. Stored at **monorepo root**.

```toml
# Subtrees and their push targets. One table per subtree; key is a label (e.g. path or slug).

[subtree "apps/sona"]
path = "apps/sona"
remote = "sona"
branch = "main"

[subtree "packages/db"]
path = "packages/db"
remote = "db"
branch = "main"
```

- **path** — Prefix used for `git subtree push --prefix=<path>` (must match the subtree add prefix).
- **url** — Remote URL; script uses this to find or create the Git remote name used for push.
- **branch** — Branch to push to on the remote (e.g. `main`).

Optional: add an explicit **remote** key per subtree if we want to force a specific remote name instead of deriving from url.

---

## Script behavior

1. **Resolve monorepo root**  
   From current directory, walk up until a directory containing `.gittrees` is found, or until Git repo root. If no `.gittrees` at repo root, run `git push "$@"` and exit.

2. **Run normal push**  
   `git push "$@"` (pass through all arguments, e.g. `origin main`).

3. **Parse `.gittrees`**  
   Read TOML; for each subtree entry, get `path`, `remote`, `branch`.

4. **For each subtree**  
   Ensure the Git remote exists. Run:
   `git subtree push --prefix=<path> <remote> <branch>`

5. **Failure mode**  
   If any subtree push fails, script exits non-zero; optional: continue with remaining subtrees and report at end.

---

## Implementation notes (for later)

- **Language**: Shell (bash) or Node script. Shell keeps deps minimal; Node allows a single TOML parser and is consistent with pnpm/JS tooling.
- **Remote naming**: If remote for `remote` doesn’t exist, skip & echo an error message (e.g. "remote "sona" for git subtree "apps/sona" does not exist, did you forget to add it?").
- **Where to put the script**: e.g. `scripts/git-push-with-subtrees.sh` or `scripts/push-all.ts`; expose via `package.json` script and/or Git alias in repo docs.
- **.gittrees not tracked**: Decide whether `.gittrees` is committed (recommended) so the whole team gets the same push behavior.

---

## Prerequisites

- Monorepo has already flattened submodules via `git subtree add` (see TODO: flatten git tree).
- Each subtree entry’s `path` matches the prefix used when adding that subtree.
