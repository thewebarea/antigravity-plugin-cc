import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// The gate hook resolves its cwd from the Stop payload, and /agy:setup resolves
// it from the environment. When the session sits in a subdirectory those two
// disagree, so setup reports the gate off while the hook reads it on. Anchoring
// both on the repository root removes the disagreement at its source.
//
// The walk looks for `.git` rather than shelling out to `git rev-parse`: no
// spawn, no dependency on git being installed, and nothing to go wrong with
// Windows shim resolution.
//
// The walk never climbs to the home directory or above it. A `.git` there (a
// dotfiles repository, or an empty stub some tool left behind) would otherwise
// make every directory under home without its own `.git` resolve to the whole
// home directory, and transfer, setup and the stop gate would hand agy all of
// it as its workspace. The caller's own directory is used instead. `home` is a
// parameter only so tests can pick one.
export function resolveWorkspaceRoot(cwd, home = safeHomedir()) {
  let current;
  try {
    current = path.resolve(String(cwd || process.cwd()));
  } catch {
    return String(cwd || "");
  }
  const homeDir = home ? path.resolve(home) : null;

  // `.git` is a directory in a normal clone and a file in a worktree or
  // submodule, so existence is the test, not directory-ness.
  let candidate = current;
  while (true) {
    if (candidate !== current && homeDir && isSameOrAncestor(candidate, homeDir)) {
      return current;
    }
    if (fs.existsSync(path.join(candidate, ".git"))) {
      return candidate;
    }
    const parent = path.dirname(candidate);
    if (parent === candidate) {
      // Reached the filesystem root without finding a repository. The caller's
      // own directory is the best available answer.
      return current;
    }
    candidate = parent;
  }
}

function safeHomedir() {
  try {
    return os.homedir() || null;
  } catch {
    return null;
  }
}

// True when `dir` is `target` itself or one of its ancestors.
function isSameOrAncestor(dir, target) {
  const relative = path.relative(dir, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
