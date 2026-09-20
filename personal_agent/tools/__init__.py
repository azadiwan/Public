"""Builds the tool list handed to the Claude tool runner."""
from anthropic.tools import BetaLocalFilesystemMemoryTool

from .. import config
from . import calendar as calendar_tools
from . import drive as drive_tools
from . import filesystem
from . import gmail as gmail_tools
from . import shell


def build_tools() -> list:
    tools: list = [
        BetaLocalFilesystemMemoryTool(base_path=str(config.MEMORY_DIR)),
        filesystem.read_file,
        filesystem.write_file,
        filesystem.list_files,
        {"type": "web_search_20260209", "name": "web_search"},
        {"type": "web_fetch_20260209", "name": "web_fetch"},
    ]

    if config.SHELL_TOOL_ENABLED:
        tools.append(shell.run_command)

    if config.GOOGLE_CREDENTIALS_PATH.exists():
        tools += [
            gmail_tools.gmail_search,
            gmail_tools.gmail_read,
            gmail_tools.gmail_create_draft,
            gmail_tools.gmail_send,
            calendar_tools.calendar_list_events,
            calendar_tools.calendar_search_events,
            calendar_tools.calendar_create_event,
            drive_tools.drive_search,
            drive_tools.drive_read_file,
        ]
    else:
        print(
            f"[personal_agent] No Google credentials found at {config.GOOGLE_CREDENTIALS_PATH} "
            "- Gmail/Calendar/Drive tools are disabled. See README.md to enable them."
        )

    return tools
