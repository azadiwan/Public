"""Gmail tools: search, read, draft, and send email."""
import base64
from email.mime.text import MIMEText

from anthropic import beta_tool
from googleapiclient.discovery import build

from . import google_auth

SCOPES = [
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.send",
]


def _service():
    creds = google_auth.get_credentials(SCOPES, "gmail")
    return build("gmail", "v1", credentials=creds)


def _header(headers: list[dict], name: str) -> str:
    for h in headers:
        if h["name"].lower() == name.lower():
            return h["value"]
    return ""


@beta_tool
def gmail_search(query: str, max_results: int = 10) -> str:
    """Search the user's Gmail inbox and return matching messages' metadata.

    Args:
        query: Gmail search query, e.g. "from:boss@company.com is:unread" or "subject:invoice".
        max_results: Maximum number of messages to return (default 10, max 50).
    """
    svc = _service()
    max_results = min(max(max_results, 1), 50)
    resp = svc.users().messages().list(userId="me", q=query, maxResults=max_results).execute()
    messages = resp.get("messages", [])
    if not messages:
        return "No matching messages."

    lines = []
    for m in messages:
        full = (
            svc.users()
            .messages()
            .get(userId="me", id=m["id"], format="metadata", metadataHeaders=["From", "Subject", "Date"])
            .execute()
        )
        headers = full.get("payload", {}).get("headers", [])
        lines.append(
            f"id={m['id']} | from={_header(headers, 'From')} | subject={_header(headers, 'Subject')} "
            f"| date={_header(headers, 'Date')} | snippet={full.get('snippet', '')}"
        )
    return "\n".join(lines)


def _extract_body(payload: dict) -> str:
    if payload.get("mimeType") == "text/plain" and payload.get("body", {}).get("data"):
        return base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8", errors="replace")
    for part in payload.get("parts", []) or []:
        text = _extract_body(part)
        if text:
            return text
    return ""


@beta_tool
def gmail_read(message_id: str) -> str:
    """Read the full content of a Gmail message by its id (from gmail_search results).

    Args:
        message_id: The Gmail message id.
    """
    svc = _service()
    msg = svc.users().messages().get(userId="me", id=message_id, format="full").execute()
    headers = msg.get("payload", {}).get("headers", [])
    body = _extract_body(msg.get("payload", {})) or "(no plain-text body found)"
    return (
        f"From: {_header(headers, 'From')}\n"
        f"To: {_header(headers, 'To')}\n"
        f"Subject: {_header(headers, 'Subject')}\n"
        f"Date: {_header(headers, 'Date')}\n\n"
        f"{body[:6000]}"
    )


def _build_raw_message(to: str, subject: str, body: str) -> dict:
    message = MIMEText(body)
    message["to"] = to
    message["subject"] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
    return {"raw": raw}


@beta_tool
def gmail_create_draft(to: str, subject: str, body: str) -> str:
    """Create a Gmail draft (does not send it).

    Args:
        to: Recipient email address.
        subject: Email subject line.
        body: Plain-text email body.
    """
    svc = _service()
    draft = svc.users().drafts().create(userId="me", body={"message": _build_raw_message(to, subject, body)}).execute()
    return f"Draft created with id {draft['id']}."


@beta_tool
def gmail_send(to: str, subject: str, body: str) -> str:
    """Send an email immediately from the user's Gmail account. Asks the user to
    confirm before sending, since this is irreversible and visible to the recipient.

    Args:
        to: Recipient email address.
        subject: Email subject line.
        body: Plain-text email body.
    """
    print(f"\n[personal_agent] Claude wants to send an email to {to} with subject '{subject}':\n{body}\n")
    answer = input("Send this email? [y/N] ").strip().lower()
    if answer not in ("y", "yes"):
        return "Error: the user declined to send this email."

    svc = _service()
    sent = svc.users().messages().send(userId="me", body=_build_raw_message(to, subject, body)).execute()
    return f"Email sent with id {sent['id']}."
