# PostgreSQL setup

Use a separate PostgreSQL database for each customer installation. McTiers
stores test sessions, current global tiers, and tier-change history there.

## Database requirements

- PostgreSQL 14 or newer
- A database and user dedicated to this McTiers installation
- Network access from the bot host to the database host
- TLS enabled when required by the database provider

Create the database and user through the selected PostgreSQL provider. Do not
reuse the Replit development database for customer hosting.

## Connection URL

Set `DATABASE_URL` in the installation's environment:

```text
postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

Use the exact TLS/query parameters supplied by the database provider. Keep the
password out of source code, GitHub, support tickets, and logs.

## Apply schema migrations

From the McTiers installation directory, run:

```bash
npm install
npm run db:generate
npm run db:migrate:deploy
```

`db:migrate:deploy` applies the checked-in Prisma migration history without
creating a new migration. For local schema development only, use
`npm run db:migrate:dev`.

Back up the database before upgrades. Do not edit or delete migration history
for a customer installation to work around a failed migration.
