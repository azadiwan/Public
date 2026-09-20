# Personal AI Agent

A tool-using personal assistant built on the Claude API. It runs locally, keeps
durable memory of facts/preferences across conversations, can read/write files
and run shell commands in a sandboxed workspace, search and fetch the web, and
(optionally) read/search/send your Gmail, manage your Google Calendar, and
search your Google Drive.

## Setup

1. Create a virtual environment and install dependencies:

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Copy `.env.example` to `.env` and set your Anthropic API key:

   ```bash
   cp .env.example .env
   # edit .env and set ANTHROPIC_API_KEY
   ```

3. Run the agent:

   ```bash
   python -m personal_agent.agent
   ```

All agent state (memory, workspace files, Google auth tokens) lives under
`./data/`, which is gitignored.

## Commands

- `/help` - list commands
- `/clear` - start a fresh conversation (long-term memory is unaffected)
- `/memory_view` - show everything the agent has stored in long-term memory
- `/memory_clear` - erase all long-term memory
- `/quit` or `/exit` - exit

## Tools

Always available:

- **Filesystem** - read/write/list files inside `data/workspace/` (sandboxed;
  the agent cannot access files outside this directory).
- **Shell** - run a shell command inside `data/workspace/`. Asks for
  confirmation before running (disable with `SHELL_CONFIRM=false` in `.env`,
  or disable the tool entirely with `SHELL_TOOL_ENABLED=false`).
- **Web search / web fetch** - Anthropic-hosted server tools, no setup needed.
- **Memory** - persistent notes the agent uses to remember who you are and
  what you care about between conversations, stored under `data/memory/`.

Enabled automatically once Google OAuth is set up (see below):

- **Gmail** - search, read, create drafts, and send email (sending asks for
  confirmation first).
- **Calendar** - list/search upcoming events and create new ones (creating
  asks for confirmation first, since it can notify attendees).
- **Drive** - search files and read their contents (read-only).

## Enabling Gmail / Calendar / Drive

1. In the [Google Cloud Console](https://console.cloud.google.com/), create a
   project (or use an existing one) and enable the **Gmail API**, **Google
   Calendar API**, and **Google Drive API**.
2. Go to **APIs & Services > Credentials**, create an **OAuth client ID** of
   type **Desktop app**, and download the resulting JSON file.
3. Save it as `data/credentials.json` (create the `data/` directory first if
   it doesn't exist yet).
4. Go to **APIs & Services > OAuth consent screen** and add your own Google
   account as a test user (required while the app is unpublished).
5. Restart the agent. The first time it uses a Google tool, a browser window
   opens for you to sign in and grant access; the resulting token is cached
   under `data/google_tokens/` so you won't be asked again.

If `data/credentials.json` is missing, the agent starts up fine with Gmail/
Calendar/Drive tools simply disabled.

## Configuration

All settings are read from `.env` (see `.env.example` for the full list):
API key, model choice, shell tool behavior, and custom paths for data storage
and the Google credentials file.
