# Manual beta fulfillment and packaging

McTiers Beta is currently delivered manually. This repository intentionally
does not automate sales, customer onboarding, configuration, ZIP generation,
or customer dashboards.

## One-time setup per customer

1. Confirm the purchase and collect the customer's Discord bot token, Client
   ID, Server ID, and PostgreSQL connection details through a secure process.
2. Create a new working directory outside the shared source checkout. Keep it
   dedicated to this one customer.
3. Copy the McTiers source into that directory without copying `.git`,
   `node_modules`, build output, or any other customer's files.
4. Create that directory's `.env` from `.env.example` and enter only that
   customer's configuration. Generate a new `API_ADMIN_KEY` for this
   installation.
5. Apply the customer's database migrations, register the bot commands, and
   perform a brief smoke check.
6. Create the personalized ZIP manually from this isolated directory.
7. If the ZIP contains `.env`, treat the entire ZIP as a credential-bearing
   secret: send it only through an approved secure delivery channel, never
   email it as an ordinary attachment, and remove temporary copies after
   delivery. Prefer asking the customer to enter secrets directly into the
   hosting provider when practical.
8. Send the installation and hosting guides with the ZIP. Explain that the
   customer hosts and maintains the bot themselves.
9. Remove the working directory and ZIP from shared or temporary storage once
   delivery and any required support period are complete.

## GitHub and source-control rules

- Commit only the blank `.env.example`, source, migrations, and documentation.
- Never commit a customer `.env`, Discord token, database URL/password,
  application/server configuration bundle, or API admin key.
- Never put a customer's token in a shared source file, template, issue,
  commit message, or public package.
- Do not use your personal Discord token in a customer archive.
- Keep each customer's configuration and database separate. Do not copy one
  customer's database dump into another installation.

## Manual packaging checklist

- [ ] The directory is dedicated to one customer.
- [ ] The ZIP contains the intended McTiers source and installation guides.
- [ ] No `.git`, `node_modules`, logs, unrelated customer files, or local
  development data are included.
- [ ] Any included `.env` belongs only to this customer and the ZIP is handled
  as a secret.
- [ ] No credentials from the ZIP were added to GitHub.
- [ ] The customer knows where to add host secrets and how to start the bot.
