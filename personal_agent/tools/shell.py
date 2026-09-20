"""A confirmed local shell-command tool, sandboxed to the workspace directory."""
import subprocess

from anthropic import beta_tool

from .. import config


@beta_tool
def run_command(command: str) -> str:
    """Run a shell command on the user's machine and return its output.

    The command runs inside the agent's workspace directory. The user is asked
    to confirm before it executes (unless confirmation is disabled in config).

    Args:
        command: The shell command to run, e.g. "ls -la" or "python script.py".
    """
    if config.SHELL_CONFIRM:
        print(f"\n[personal_agent] Claude wants to run: {command}")
        answer = input("Allow this command? [y/N] ").strip().lower()
        if answer not in ("y", "yes"):
            return "Error: the user declined to run this command."

    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=str(config.WORKSPACE_DIR),
            capture_output=True,
            text=True,
            timeout=config.SHELL_TIMEOUT_SECONDS,
        )
    except subprocess.TimeoutExpired:
        return f"Error: command timed out after {config.SHELL_TIMEOUT_SECONDS}s."

    output = f"exit code: {result.returncode}\nstdout:\n{result.stdout}\nstderr:\n{result.stderr}"
    return output[:8000]
