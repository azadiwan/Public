"""Sandboxed file tools scoped to the agent's workspace directory."""
from pathlib import Path

from anthropic import beta_tool

from .. import config


def _resolve(path: str) -> Path:
    root = config.WORKSPACE_DIR.resolve()
    target = (root / path).resolve()
    if target != root and root not in target.parents:
        raise ValueError(f"Path '{path}' escapes the workspace directory")
    return target


@beta_tool
def read_file(path: str) -> str:
    """Read a text file from the agent's workspace directory.

    Args:
        path: Path relative to the workspace root, e.g. "notes/todo.md".
    """
    target = _resolve(path)
    if not target.exists():
        return f"Error: '{path}' does not exist in the workspace."
    if not target.is_file():
        return f"Error: '{path}' is not a file."
    return target.read_text(encoding="utf-8", errors="replace")


@beta_tool
def write_file(path: str, content: str) -> str:
    """Write (create or overwrite) a text file in the agent's workspace directory.

    Args:
        path: Path relative to the workspace root, e.g. "notes/todo.md".
        content: Full text content to write to the file.
    """
    target = _resolve(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    return f"Wrote {len(content)} characters to '{path}'."


@beta_tool
def list_files(path: str = ".") -> str:
    """List files and directories inside the agent's workspace directory.

    Args:
        path: Sub-directory relative to the workspace root to list. Defaults to the workspace root.
    """
    target = _resolve(path)
    if not target.exists():
        return f"Error: '{path}' does not exist in the workspace."
    if not target.is_dir():
        return f"Error: '{path}' is not a directory."
    entries = sorted(target.iterdir(), key=lambda p: (p.is_file(), p.name))
    if not entries:
        return "(empty directory)"
    lines = []
    for entry in entries:
        kind = "dir" if entry.is_dir() else "file"
        lines.append(f"{kind}\t{entry.name}")
    return "\n".join(lines)
