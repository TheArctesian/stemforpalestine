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

### Database Management

- `yarn db:push` - Push schema changes to database
- `yarn db:generate` - Generate migration files
- `yarn db:migrate` - Run database migrations
- `yarn db:studio` - Open Drizzle Studio for database management

## Architecture

### Tech Stack

- **Framework**: SvelteKit with TypeScript
- **Database ORM**: Drizzle ORM with Neon PostgreSQL
- **Preprocessors**: MDsveX for Markdown support in Svelte components
- **Build Tool**: Vite

### Project Structure

- `src/routes/` - SvelteKit routes and pages
- `src/lib/` - Shared library code
- `src/lib/server/db/` - Database configuration and schema
  - `schema.ts` - Database schema definitions
  - `index.ts` - Database connection setup
- `static/` - Static assets
- `drizzle.config.ts` - Drizzle ORM configuration

### Key Configuration Files

- `svelte.config.js` - SvelteKit configuration with MDsveX support for `.svelte` and `.svx` files
- `drizzle.config.ts` - Database schema location: `./src/lib/server/db/schema.ts`
- Environment variable `DATABASE_URL` required for database connection

### Database Access Pattern

Database is accessed server-side only through `$env/dynamic/private` for environment variables. The database client is initialized in `src/lib/server/db/index.ts` using Neon serverless driver.
