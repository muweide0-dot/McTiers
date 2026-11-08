# Hosting guide

Customers host and maintain their own McTiers instance. Choose a provider that
supports a persistent Node.js process, outbound Discord Gateway connections,
and outbound PostgreSQL connections. A short-lived serverless function is not
suitable for the Discord bot process.

## Configure the host

1. Upload and extract the customer-specific McTiers ZIP, or deploy that
   customer's private source copy.
2. Set each value from `.env.example` in the provider's secret/environment
   interface. Do not commit `.env` or upload it to a public Git repository.
3. Set the provider's assigned port as `PORT`.
4. Use the bot token, Client ID, Server ID, PostgreSQL URL, and API admin key
   created for this installation only.
5. Run the install/build command required by the host, then run migrations and
   register commands:

   ```bash
   npm install
   npm run db:generate
   npm run db:migrate:deploy
   npm run commands:deploy
   npm run build
   ```

6. Set the persistent process command to `npm start`.
7. Enable automatic restart on process failure and configure the provider's
   normal log retention and database backup options.
8. Check the provider logs and request `GET /healthz`. The endpoint reports
   whether PostgreSQL is reachable.

The REST API is protected by the installation-specific `API_ADMIN_KEY`; send
it in the `Authorization: Bearer <key>` header. Do not expose the key in a
browser, public page, or client-side application.

## Operations

The customer is responsible for keeping the bot process online, protecting
secrets, renewing hosting/database plans, backups, and applying future McTiers
updates. If credentials are exposed, rotate them in Discord or the database
provider, then update the host's secret settings.
