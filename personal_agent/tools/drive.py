"""Read-only Google Drive tools: search and read file contents."""
from anthropic import beta_tool
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io

from . import google_auth

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

GOOGLE_DOC_EXPORTS = {
    "application/vnd.google-apps.document": "text/plain",
    "application/vnd.google-apps.spreadsheet": "text/csv",
    "application/vnd.google-apps.presentation": "text/plain",
}


def _service():
    creds = google_auth.get_credentials(SCOPES, "drive")
    return build("drive", "v3", credentials=creds)


@beta_tool
def drive_search(query: str, max_results: int = 10) -> str:
    """Search the user's Google Drive by file name or content.

    Args:
        query: Free-text search, e.g. "quarterly report" or "name contains 'invoice'".
        max_results: Maximum number of files to return (default 10, max 50).
    """
    svc = _service()
    if any(op in query for op in ("=", "contains", "and", "or")):
        search_query = query
    else:
        escaped = query.replace("'", "\\'")
        search_query = f"fullText contains '{escaped}'"

    resp = (
        svc.files()
        .list(
            q=search_query,
            pageSize=min(max(max_results, 1), 50),
            fields="files(id, name, mimeType, modifiedTime, webViewLink)",
        )
        .execute()
    )
    files = resp.get("files", [])
    if not files:
        return "No matching files."
    return "\n".join(
        f"id={f['id']} | name={f['name']} | type={f['mimeType']} | modified={f.get('modifiedTime', '')}"
        for f in files
    )


@beta_tool
def drive_read_file(file_id: str) -> str:
    """Read the text content of a Google Drive file by its id (from drive_search results).
    Google Docs/Sheets/Slides are exported as text/CSV; other files are read directly.

    Args:
        file_id: The Google Drive file id.
    """
    svc = _service()
    meta = svc.files().get(fileId=file_id, fields="name, mimeType").execute()
    mime_type = meta["mimeType"]

    buffer = io.BytesIO()
    if mime_type in GOOGLE_DOC_EXPORTS:
        request = svc.files().export_media(fileId=file_id, mimeType=GOOGLE_DOC_EXPORTS[mime_type])
    else:
        request = svc.files().get_media(fileId=file_id)

    downloader = MediaIoBaseDownload(buffer, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()

    text = buffer.getvalue().decode("utf-8", errors="replace")
    return f"{meta['name']} ({mime_type}):\n\n{text[:8000]}"
