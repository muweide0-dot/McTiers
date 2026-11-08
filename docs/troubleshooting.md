# Troubleshooting

## The bot does not come online

- Confirm `DISCORD_TOKEN` is set in the host's secret settings and belongs to
  this bot application.
- Check provider logs for an authentication error. If the token was exposed,
  regenerate it in Discord and update the secret.
- Confirm the host allows long-running processes and outbound Discord
  connections.

## Slash commands do not appear

- Verify `DISCORD_CLIENT_ID` and `DISCORD_GUILD_ID` match the customer bot and
  server.
- Confirm the bot was invited with the `applications.commands` scope.
- Run `npm run commands:deploy` again and check its output.
- Guild commands should appear in the configured server; the bot rejects
  interactions from other servers.

## PostgreSQL connection or migration fails

- Check that `DATABASE_URL` is complete and uses the exact host-provided TLS
  parameters.
- Confirm the database is running and its network allowlist includes the bot
  host.
- Confirm the database user can create and alter tables during initial
  migration.
- Run `npm run db:validate`, then `npm run db:migrate:deploy`.
- Do not delete the provider's migration metadata to force a retry; back up
  first and inspect the migration error.

## `/test-start` or `/test-finish` is denied

- The command must run in the configured Discord server.
- The person running test commands needs Discord's **Manage Server**
  permission.
- `test-finish` needs an open session ID returned by `test-start`; each session
  can be completed only once.

## REST API returns 401

- Send `Authorization: Bearer <API_ADMIN_KEY>` with the exact key configured
  for this installation.
- Confirm the host did not trim, quote, or overwrite the secret value.

## REST API health check returns 503

- `GET /healthz` checks PostgreSQL as well as the web process.
- Check the database URL, provider status, network allowlist, and TLS settings.

## Where to look

Use the hosting provider's process logs. McTiers logs errors without printing
Discord tokens or database URLs. Do not paste raw environment settings into
support messages.
