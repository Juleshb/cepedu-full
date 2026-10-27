# CEPEDHU Server

Express API backed by **PostgreSQL** via **Prisma ORM**.

## Prerequisites

- Node.js 18+
- Local PostgreSQL running on `localhost:5432`
- (Optional) MySQL only if re-running the one-time data migration

## Setup

```bash
npm install
cp .env.example .env   # or edit .env directly
```

Set `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://apple@localhost:5432/cepeduh?schema=public"
```

Create the database if needed:

```bash
createdb cepeduh
```

Apply migrations and generate the Prisma client:

```bash
npm run prisma:migrate
npm run prisma:generate
```

## Run

```bash
npm run dev    # nodemon
npm start      # node app.js
```

## Prisma scripts

| Script | Description |
|---|---|
| `npm run prisma:generate` | Regenerate Prisma Client |
| `npm run prisma:migrate` | Create/apply migrations |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run migrate:mysql` | One-time MySQL → Postgres data copy |

## MySQL → Postgres data migration

If you still have the old MySQL database, keep the legacy `DB_*` vars in `.env` and run:

```bash
npm run migrate:mysql
```

This truncates Postgres tables, copies rows (preserving IDs), and resets sequences.

## Notes

- Controllers use Prisma Client from `config/db.js`.
- Money/auth multi-step flows use `prisma.$transaction`.
- Decimal and BigInt values are normalized for JSON via `utils/serialize.js`.
