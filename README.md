# McTiers Beta

McTiers is a Discord-only Minecraft PvP tier-testing bot with a TypeScript REST
API and PostgreSQL persistence. Each customer receives a separate installation
and database. The beta is distributed and configured manually.

This repository does not contain a Minecraft mod, client mod, Fabric project,
Gradle build, Minecraft GUI, customer dashboard, or automatic ZIP generator.
There are no `/player` or `/profile` commands.

## Tier and region rules

- Supported regions are exactly `EU`, `NA`, `AS`, `AU`, and `ME`.
- The ten global tiers are `LT5`, `HT5`, `LT4`, `HT4`, `LT3`, `HT3`, `LT2`,
  `HT2`, `LT1`, and `HT1`.
- Ranked best to worst: `HT1`, `LT1`, `HT2`, `LT2`, `HT3`, `LT3`, `HT4`,
  `LT4`, `HT5`, `LT5`.
- `N/A` represents no previous tier. It is not an eleventh ranked tier.
- Tiers are global and are not divided by kit.

## Discord commands

| Command | Purpose | Permission |
| --- | --- | --- |
| `/tiers` | Show the global tier order and N/A meaning | Everyone |
| `/rankings [region]` | Show up to 20 saved results, optionally filtered by region | Everyone |
| `/test-start candidate region previous-tier` | Open and persist a test session | Manage Server |
| `/test-finish session-id tier [note]` | Save the result, update the current tier, and retain history | Manage Server |

Commands are registered only in the configured Discord server. The bot checks
the server ID at runtime as well as the Discord permission.

## Quick start

Requirements: Node.js 20.11 or newer, npm, a PostgreSQL database, and a Discord
application with a bot user invited to the customer's server.

1. Copy `.env.example` to `.env`.
2. Fill in that installation's Discord token, application ID, server ID,
   PostgreSQL URL, and a unique API admin key.
3. Install packages and generate the Prisma client:

   ```bash
   npm install
   npm run db:generate
   ```

4. Apply the database migrations:

   ```bash
   npm run db:migrate:deploy
   ```

5. Register guild slash commands:

   ```bash
   npm run commands:deploy
   ```

6. Build and start the bot and REST API:

   ```bash
   npm run build
   npm start
   ```

For local development, `npm run dev` starts the TypeScript service directly.
`npm run dev:api` starts only the REST API and still requires `DATABASE_URL`
and `API_ADMIN_KEY`.

## Documentation

- [Installation guide](docs/installation.md)
- [PostgreSQL setup](docs/postgresql.md)
- [Hosting guide](docs/hosting.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Manual beta fulfillment and packaging](docs/beta-fulfillment.md)
- [REST API](docs/api.md)

## Configuration and credential safety

Each customer installation has its own environment configuration and PostgreSQL
database. Real values belong in the customer's hosting-provider secret settings
or that customer's isolated local `.env` file. `.env` files are ignored by Git;
only the blank `.env.example` is intended for source control.

Never commit your own Discord token or any customer's Discord token, application
ID, server ID, database URL, or API admin key. Never place credentials in shared
source code. Do not reuse one customer's `.env` or database for another
installation.

## Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run build` | Generate Prisma Client and compile TypeScript |
| `npm run typecheck` | Type-check the source |
| `npm test` | Run the tier and region rule tests |
| `npm run db:validate` | Validate the Prisma schema |
| `npm run db:migrate:dev` | Create/apply a migration during development |
| `npm run db:migrate:deploy` | Apply committed migrations on a customer database |
| `npm run commands:deploy` | Register slash commands in one configured server |
