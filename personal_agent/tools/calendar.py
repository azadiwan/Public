"""Google Calendar tools: list, search, and create events on the primary calendar."""
import datetime

from anthropic import beta_tool
from googleapiclient.discovery import build

from . import google_auth

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]


def _service():
    creds = google_auth.get_credentials(SCOPES, "calendar")
    return build("calendar", "v3", credentials=creds)


def _format_events(events: list[dict]) -> str:
    if not events:
        return "No events found."
    lines = []
    for e in events:
        start = e.get("start", {}).get("dateTime", e.get("start", {}).get("date"))
        end = e.get("end", {}).get("dateTime", e.get("end", {}).get("date"))
        lines.append(f"id={e['id']} | {e.get('summary', '(no title)')} | {start} -> {end}")
    return "\n".join(lines)


@beta_tool
def calendar_list_events(days_ahead: int = 7, max_results: int = 20) -> str:
    """List upcoming events on the user's primary Google Calendar.

    Args:
        days_ahead: How many days into the future to look (default 7).
        max_results: Maximum number of events to return (default 20, max 50).
    """
    svc = _service()
    now = datetime.datetime.utcnow()
    time_min = now.isoformat() + "Z"
    time_max = (now + datetime.timedelta(days=days_ahead)).isoformat() + "Z"
    resp = (
        svc.events()
        .list(
            calendarId="primary",
            timeMin=time_min,
            timeMax=time_max,
            maxResults=min(max(max_results, 1), 50),
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
    )
    return _format_events(resp.get("items", []))


@beta_tool
def calendar_search_events(query: str, max_results: int = 20) -> str:
    """Search events on the user's primary Google Calendar by text.

    Args:
        query: Free-text search query matched against event titles/descriptions.
        max_results: Maximum number of events to return (default 20, max 50).
    """
    svc = _service()
    resp = (
        svc.events()
        .list(
            calendarId="primary",
            q=query,
            maxResults=min(max(max_results, 1), 50),
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
    )
    return _format_events(resp.get("items", []))


@beta_tool
def calendar_create_event(
    summary: str,
    start: str,
    end: str,
    description: str = "",
    location: str = "",
    attendees: str = "",
) -> str:
    """Create an event on the user's primary Google Calendar. Asks the user to
    confirm before creating it, since it may notify other attendees.

    Args:
        summary: Event title.
        start: Start time as ISO 8601, e.g. "2026-09-25T14:00:00-07:00".
        end: End time as ISO 8601, e.g. "2026-09-25T15:00:00-07:00".
        description: Optional event description.
        location: Optional event location.
        attendees: Optional comma-separated list of attendee email addresses.
    """
    attendee_list = [a.strip() for a in attendees.split(",") if a.strip()]
    print(
        f"\n[personal_agent] Claude wants to create the calendar event '{summary}' "
        f"from {start} to {end}" + (f" with attendees {attendee_list}" if attendee_list else "") + "\n"
    )
    answer = input("Create this event? [y/N] ").strip().lower()
    if answer not in ("y", "yes"):
        return "Error: the user declined to create this event."

    svc = _service()
    body = {
        "summary": summary,
        "description": description,
        "location": location,
        "start": {"dateTime": start},
        "end": {"dateTime": end},
    }
    if attendee_list:
        body["attendees"] = [{"email": a} for a in attendee_list]

    created = svc.events().insert(calendarId="primary", body=body, sendUpdates="all").execute()
    return f"Event created: {created.get('htmlLink', created['id'])}"
