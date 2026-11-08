# REST API

The REST API listens on `PORT` (default `8080`). Except for the health check,
every route requires this header:

```text
Authorization: Bearer <installation-specific API_ADMIN_KEY>
```

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/healthz` | Check API and PostgreSQL availability |
| `GET` | `/api/v1/taxonomy` | Return exact supported regions and tier order |
| `GET` | `/api/v1/rankings?region=EU&limit=100` | Read ranked entries, optionally filtered to one region |
| `GET` | `/api/v1/test-sessions?status=OPEN&region=EU&limit=50` | List recent test sessions |
| `POST` | `/api/v1/test-sessions` | Open a test session |
| `POST` | `/api/v1/test-sessions/{id}/complete` | Save a result and update tier history |

`region` must be one of `EU`, `NA`, `AS`, `AU`, or `ME`. `limit` is between 1
and 100. Tier values are the ten global tier labels or `N/A`. The API does not
provide `/player` or `/profile` routes.

## Open a session

```json
{
  "candidateDiscordId": "123456789012345678",
  "candidateUsername": "ExamplePlayer",
  "region": "EU",
  "previousTier": "N/A",
  "openedByDiscordId": "234567890123456789"
}
```

## Complete a session

```json
{
  "assignedTier": "HT3",
  "completedByDiscordId": "234567890123456789",
  "note": "Optional test note"
}
```

The completion endpoint is transactional: the session, current global tier,
and audit history are written together. A test session can be completed once.
