## Learned User Preferences
- When auditing or extending Stripe checkout and payment flows, align with established Stripe integration best practices (the user has pointed agents at external recommendation resources for those audits).

## Learned Workspace Facts

- Stack: Next.js (App Router), Bun to run Next.js (`dev` / `build` / `start`), Prisma with PostgreSQL, Biome for lint (`bun run lint`), Stripe, Resend, Vercel Blob, Better Auth.
- Stripe test vs live behavior follows API keys in the environment, not an in-app sandbox mode flag.
- Stripe webhook handling is implemented in `src/app/api/stripe/webhook/route.ts`; `src/app/api/webhooks/stripe/route.ts` re-exports the same handler for an alternate URL path.
