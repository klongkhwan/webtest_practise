# Auth API validation design

## Scope

Bring the existing Auth API behavior in line with the agreed baseline test cases without changing its successful-login response contract or cookie-session support.

## Login: `POST /api/auth/login`

- Reject a missing `email` or `password` with HTTP 400.
- Reject a non-string, blank, or malformed email with HTTP 400 and a validation error.
- Trim the email before validation and before it is sent to Supabase.
- For any failed credential check from Supabase, return HTTP 401 with `{ "error": "Invalid credentials" }`. Do not return the Supabase error text.
- Preserve the existing successful HTTP 200 response, including tokens and the user profile.

## Current user: `GET /api/auth/me`

- A valid `Authorization: Bearer <token>` continues to authenticate the request.
- If an `Authorization` header is supplied but does not contain a valid Bearer token, do not fall back to a cookie session; return HTTP 401.
- If no `Authorization` header is supplied, retain cookie-session authentication.

## Verification

Add focused automated route tests for malformed email, generic credential errors, and invalid Bearer tokens with a valid cookie session. Run the relevant tests, type-check, and lint before handoff.
