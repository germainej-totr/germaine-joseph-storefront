This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Quality Gate (Done Checklist)

Run one command before push/deploy:

```bash
npm run qa:predeploy
```

For CI/staging environments where migration readiness must be enforced, use:

```bash
npm run qa:predeploy:strict
```

This runs, in order:

1. Prisma connectivity healthcheck (`qa:prisma-connectivity`)
2. Contract regression tests (`test:contracts`)
3. Lint (`lint`)
4. Production build (`build`)

If this command passes, the current branch is considered release-ready.

Strict mode runs migration doctor gate first (`db:migrate:doctor:gate`) and fails fast when Prisma doctor JSON reports `ok: false`.

## Prisma Workflow

This project now uses Prisma config from `prisma.config.ts` (not `package.json#prisma`).

Common commands:

```bash
npx prisma migrate status
npm run db:migrate:safe -- <change_name>
npm run db:migrate:doctor
npm run db:migrate:doctor:json
npm run db:migrate:doctor:gate
npx prisma generate
```

Important note:

- Do not run `npx prisma migrate resolve --applied 0_init` in normal development.
- `0_init` is already applied in this environment, so re-resolving it returns an error by design.
- Prefer `npm run db:migrate:safe -- <change_name>` so connectivity is checked before migrations run.
- `db:migrate:safe` blocks reserved migration names like `init` and `0_init`; use descriptive names (for example `add_deposit_status`).

## Prisma Troubleshooting

For transient Prisma connectivity errors (for example P1001), run:

```bash
npm run qa:prisma-connectivity
```

This checks:

1. DNS resolution for the database host
2. TCP connectivity to port 5432
3. A non-destructive Prisma query (`SELECT 1`) via `prisma db execute`

The healthcheck includes retries and supports these environment overrides:

- `PRISMA_HEALTH_RETRIES` (default: `3`)
- `PRISMA_HEALTH_RETRY_DELAY_MS` (default: `1500`)
- `PRISMA_HEALTH_TCP_TIMEOUT_MS` (default: `5000`)

Example with longer retry window:

```bash
PRISMA_HEALTH_RETRIES=6 PRISMA_HEALTH_RETRY_DELAY_MS=2000 npm run qa:prisma-connectivity
```

If connectivity still fails:

1. Verify `DATABASE_URL` is present in `.env` or `.env.local`
2. Run `npx prisma migrate status` to check migration metadata
3. Do not run `migrate resolve --applied 0_init` unless repairing migration history intentionally

If migration commands are failing and you need a guided diagnostic pass:

```bash
npm run db:migrate:doctor
```

For CI/support tooling, use structured output:

```bash
npm run db:migrate:doctor:json
```

For CI gating (fails with non-zero exit when `ok` is false):

```bash
npm run db:migrate:doctor:gate
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
