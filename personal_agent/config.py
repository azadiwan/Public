"""Configuration and shared paths for the personal agent."""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("AGENT_DATA_DIR", PROJECT_ROOT / "data")).resolve()
WORKSPACE_DIR = DATA_DIR / "workspace"
MEMORY_DIR = DATA_DIR / "memory"
TOKENS_DIR = DATA_DIR / "google_tokens"

for _dir in (DATA_DIR, WORKSPACE_DIR, MEMORY_DIR, TOKENS_DIR):
    _dir.mkdir(parents=True, exist_ok=True)

MODEL = os.environ.get("CLAUDE_MODEL", "claude-opus-5")

SHELL_TOOL_ENABLED = os.environ.get("SHELL_TOOL_ENABLED", "true").lower() == "true"
SHELL_CONFIRM = os.environ.get("SHELL_CONFIRM", "true").lower() == "true"
SHELL_TIMEOUT_SECONDS = int(os.environ.get("SHELL_TIMEOUT_SECONDS", "60"))

GOOGLE_CREDENTIALS_PATH = Path(
    os.environ.get("GOOGLE_CREDENTIALS_PATH", DATA_DIR / "credentials.json")
).resolve()
