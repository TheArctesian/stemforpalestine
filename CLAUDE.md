# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SvelteKit application with Drizzle ORM for database management, using Neon PostgreSQL as the database provider.

## Development Commands

### Core Development

- `yarn dev` - Start development server
- `yarn build` - Build production version
- `yarn preview` - Preview production build
- `yarn check` - Run type checking with svelte-check
- `yarn check:watch` - Run type checking in watch mode

### Code Quality

- `yarn lint` - Check code formatting with Prettier
- `yarn format` - Auto-format code with Prettier
- `yarn test` - Run unit tests with Vitest (`src/**/*.test.ts`)

### Database Management

- `yarn db:generate` - Generate a migration file in `drizzle/` from schema changes (commit it)
- `yarn db:migrate` - Apply pending migrations
- `yarn db:studio` - Open Drizzle Studio for database management
- `yarn db:push` - Push schema changes directly, without a migration (local experiments only)
- `yarn user:create -- --username admin --role admin` - Create a user, prompting for the password (`--reset` sets a new password for an existing user). There is no public sign-up, so this is how the first admin account is made.

## Architecture

### Tech Stack

- **Framework**: SvelteKit with TypeScript
- **Database ORM**: Drizzle ORM with Neon PostgreSQL
- **Preprocessors**: MDsveX for Markdown support in Svelte components
- **Build Tool**: Vite

### Project Structure

- `src/routes/` - SvelteKit routes and pages
  - `(site)/` - The public site; its layout has the nav and footer
  - `admin/` - The admin area, with its own sidebar layout (`login/+page@.svelte` escapes it)
- `src/hooks.server.ts` - Resolves the session cookie and guards every `/admin` route
- `src/lib/` - Shared library code
- `src/lib/admin/` - Admin UI components and the shared `admin.css`
- `src/lib/server/` - Server-only code: `auth.ts` (sessions), `password.ts` (argon2), `rate-limit.ts`
- `src/lib/data/events.ts` - The `StemEvent` type and formatting helpers; events themselves live in the `events` table (`src/lib/server/events.ts` maps rows to `StemEvent`)
- `src/lib/server/db/` - Database configuration and schema
  - `schema.ts` - Database schema definitions
  - `index.ts` - Database connection setup
- `drizzle/` - Generated SQL migrations
- `static/` - Static assets
- `drizzle.config.ts` - Drizzle ORM configuration

### Key Configuration Files

- `svelte.config.js` - SvelteKit configuration with MDsveX support for `.svelte` and `.svx` files
- `drizzle.config.ts` - Database schema location: `./src/lib/server/db/schema.ts`
- Environment variables: `DATABASE_URL` and `APP_SECRET` (see `.env.example`)

### Database Access Pattern

Database is accessed server-side only through `$env/dynamic/private` for environment variables. The database client is initialized in `src/lib/server/db/index.ts` with node-postgres (`pg`), which works with both Neon (use the pooled connection string in production) and a local Postgres for development.

### Admin Auth

Database sessions (`users`, `sessions` tables): the `s4p_session` cookie holds a random token and the database stores its SHA-256. `hooks.server.ts` rejects anyone who isn't a signed-in `admin` on every `/admin` path except `/admin/login`, which also covers form actions and `+server.ts` endpoints. Actions still call `requireAdmin(locals)` from `$lib/server/permissions`. `member` accounts can exist but have no admin access yet.

### Forms

Forms are built in the admin (`/admin/forms`) and served at `/forms/<slug>`. A form's questions are JSON in `forms.fields`, shaped by `src/lib/forms/definition.ts` (zod). The rest of `src/lib/forms/` has no zod and is shared by the public page, the builder and the server:

- `conditions.ts` - Show/hide and ending rules (`evaluate`, `isVisible`); the email audience filters reuse it
- `validate.ts` - `readFormData` → `validateSubmission`. Runs in the browser for instant errors and again on the server, which is what counts. Hidden questions are skipped and their answers dropped.
- `templates.ts` - "New form" starting points, including the interest form as it was on Fillout
- `import.ts` - Turning CSV cells into answers for the import page

Answers (`form_submissions.data`) are keyed by field **id**, so they survive a question being reworded. A field's **key** is what email placeholders (`{{name}}`) and audience filters use. A question that already has answers can only be archived, not deleted. Rich text from the editor is cleaned with `sanitizeRichText` (`src/lib/server/sanitize.ts`) when saved, because it's rendered with `{@html}`.

`/interest` (the site's sign-up link) redirects to the `interest` form while it's open, and to the old Fillout form otherwise.

### Email

Templates (`email_templates`) are linked to forms; their `{{key}}` placeholders are filled from each recipient's answers (`src/lib/email/placeholders.ts`). A campaign copies the template's subject and HTML when it's made, and its audience is forms plus rules by field key, resolved in `src/lib/email/audience.ts`: only each person's latest answer to a form counts, one email per address, and `email_suppressions` (unsubscribes, bounces, complaints, manual) are always left out.

Sending (`src/lib/server/email/send.ts`) needs no job queue: starting a campaign writes one queued `email_messages` row per recipient, and the campaign page POSTs to `/admin/email/campaigns/[id]/send` repeatedly, each call claiming and sending up to 100. Claims older than 10 minutes are picked up again. With no `RESEND_API_KEY`, development logs emails to the console.

SvelteKit's built-in CSRF check is turned off in `svelte.config.js` and done in `hooks.server.ts` instead, so `/api/email/unsubscribe` can accept one-click unsubscribes that mail apps POST without an `Origin` header. Keep the check in hooks if you touch it.

### Events

Events are edited at `/admin/events` and stored in the `events` table; drafts are visible only to admins. Times are entered and shown in Bay Area time (`EVENT_TIME_ZONE`), converted with `zonedToIso` / `isoToZoned`. The first event was moved into the database by a data migration (`drizzle/0004_seed-principled-in-tech.sql`). Its poster now lives in `static/events/`, while uploaded posters and speaker photos go to Vercel Blob through `/admin/uploads`. Public event pages send `s-maxage=60`, so edits can take a minute to show.
