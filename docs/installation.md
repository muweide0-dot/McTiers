# Installation guide

This guide is for one McTiers Beta installation. Repeat it with a fresh
directory, a separate bot application, and a separate PostgreSQL database for
each customer.

## 1. Prepare the Discord application

1. Create a Discord application in the Discord Developer Portal.
2. Create its bot user and copy the bot token once.
3. Enable the `applications.commands` scope and invite the bot to the
   customer's server. The bot needs to view the server and use application
   commands; no message-content intent is required.
4. Record the application Client ID and the customer's Server ID.
5. Keep the token in a password manager or the customer's hosting-provider
   secrets. Do not send it in ordinary Discord messages or add it to GitHub.

## 2. Configure a separate installation

1. Extract the McTiers source archive into a new customer-specific directory.
   Do not reuse a working directory containing another customer's credentials.
2. Copy `.env.example` to `.env`.
3. Fill these values for this installation:

   | Variable | Value |
   | --- | --- |
   | `DISCORD_TOKEN` | This installation's bot token |
   | `DISCORD_CLIENT_ID` | Its Discord application Client ID |
   | `DISCORD_GUILD_ID` | Its Discord Server ID |
   | `DATABASE_URL` | Its PostgreSQL connection URL |
   | `API_ADMIN_KEY` | A unique random value, at least 32 characters |
   | `PORT` | Hosting provider port, normally `8080` |
   | `LOG_LEVEL` | `info` for normal use |

   Generate a unique API key with:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

4. Install and prepare the application:

   ```bash
   npm install
   npm run db:generate
   npm run db:migrate:deploy
   npm run commands:deploy
   npm run build
   ```

5. Start the service with `npm start`.
6. Confirm `GET /healthz` returns `{"status":"ok"}` and test `/tiers` in the
   configured server.

## Local environment file

The `.env` file is a per-installation secret. Keep it out of Git, screenshots,
support tickets, and shared source folders. On a hosting provider, prefer its
secret/environment settings over uploading `.env`; see the hosting guide.
