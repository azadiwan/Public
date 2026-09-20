"""Shared OAuth helper for Google Workspace tools (Gmail, Calendar, Drive)."""
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

from .. import config


def get_credentials(scopes: list[str], token_name: str) -> Credentials:
    """Return cached, valid OAuth credentials for the given scopes, running the
    interactive consent flow the first time it's needed."""
    token_path = config.TOKENS_DIR / f"{token_name}.json"

    creds = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), scopes)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not config.GOOGLE_CREDENTIALS_PATH.exists():
                raise FileNotFoundError(
                    f"Google OAuth client secret not found at {config.GOOGLE_CREDENTIALS_PATH}. "
                    "See README.md for how to create one."
                )
            flow = InstalledAppFlow.from_client_secrets_file(
                str(config.GOOGLE_CREDENTIALS_PATH), scopes
            )
            creds = flow.run_local_server(port=0)
        token_path.write_text(creds.to_json())

    return creds
