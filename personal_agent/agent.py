"""Interactive CLI for the personal AI agent."""
from anthropic import Anthropic
from anthropic.tools import BetaLocalFilesystemMemoryTool
from anthropic.types.beta import BetaMemoryTool20250818ViewCommand

from . import config
from .tools import build_tools

SYSTEM_PROMPT = """You are a personal AI agent running on the user's own machine. You have
tools to read/write files and run shell commands in a local workspace, search and fetch
the web, and (when configured) read/search/send the user's Gmail, manage their Google
Calendar, and search/read their Google Drive.

Use the memory tool to remember durable facts about the user (preferences, ongoing
projects, recurring context) across conversations - check it when relevant, and keep it
up to date rather than re-asking the user things you should already know. Don't narrate
routine memory reads/writes to the user unless asked.

Tools with real-world side effects (sending email, creating calendar events, running
shell commands) already ask the user to confirm before executing - you don't need to
ask a second time, just call the tool.
"""

MAX_PAUSE_RESTARTS = 5


def _find_memory_tool(tools: list) -> BetaLocalFilesystemMemoryTool | None:
    for tool in tools:
        if isinstance(tool, BetaLocalFilesystemMemoryTool):
            return tool
    return None


def run_turn(client: Anthropic, tools: list, messages: list) -> None:
    """Run one user turn to completion, handling tool calls and pause_turn restarts."""
    restarts = 0
    while True:
        runner = client.beta.messages.tool_runner(
            model=config.MODEL,
            max_tokens=16000,
            system=SYSTEM_PROMPT,
            tools=tools,
            messages=messages,
        )

        last = None
        for message in runner:
            last = message
            messages.append({"role": "assistant", "content": message.content})
            tool_response = runner.generate_tool_call_response()
            if tool_response is not None:
                messages.append(tool_response)

            for block in message.content:
                if block.type == "text" and block.text:
                    print(block.text, end="", flush=True)

        if last is None or last.stop_reason != "pause_turn":
            print()
            return

        restarts += 1
        if restarts > MAX_PAUSE_RESTARTS:
            print("\n[personal_agent] Giving up: response paused too many times.")
            return


def main() -> None:
    if not (config.PROJECT_ROOT / ".env").exists():
        print("[personal_agent] No .env file found - copy .env.example to .env and set ANTHROPIC_API_KEY.")

    client = Anthropic()
    tools = build_tools()
    memory_tool = _find_memory_tool(tools)
    messages: list = []

    print(f"Personal AI agent ready (model: {config.MODEL}). Type /help for commands.\n")

    while True:
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if not user_input:
            continue

        if user_input == "/help":
            print("/quit or /exit - exit\n/clear - start a fresh conversation\n"
                  "/memory_view - show stored memory\n/memory_clear - erase stored memory")
            continue
        if user_input in ("/quit", "/exit"):
            print("Goodbye!")
            break
        if user_input == "/clear":
            messages = []
            print("Conversation cleared.")
            continue
        if user_input == "/memory_view":
            if memory_tool is None:
                print("Memory tool is not enabled.")
            else:
                print(memory_tool.execute(BetaMemoryTool20250818ViewCommand(command="view", path="/memories")))
            continue
        if user_input == "/memory_clear":
            if memory_tool is None:
                print("Memory tool is not enabled.")
            else:
                print(memory_tool.clear_all_memory())
            continue

        messages.append({"role": "user", "content": user_input})
        print("Agent: ", end="", flush=True)
        run_turn(client, tools, messages)


if __name__ == "__main__":
    main()
