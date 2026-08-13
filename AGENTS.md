# Repository Guide

## Project

- This is a single-package Next.js 16 App Router app; the application entrypoints are under `src/app/`.
- `src/app/page.tsx` is the home route, `layout.tsx` owns global metadata/fonts/layout, and `globals.css` imports Tailwind CSS v4.
- TypeScript path alias `@/*` resolves to `src/*`.
- Keep generated or local files out of changes: `node_modules/`, `.next/`, `out/`, `build/`, `next-env.d.ts`, `*.tsbuildinfo`, and `.env*` are ignored.

## Commands

- Install dependencies with `npm install`; use the committed `package-lock.json` and npm rather than switching package managers.
- Start the dev server with `npm run dev` and open `http://localhost:3000`.
- Run checks in this order: `npm run lint`, then `npx tsc --noEmit`, then `npm run build` when a production build is relevant.
- There is no test runner or test script in `package.json`; do not claim tests passed unless a test tool is added or invoked explicitly.
- Run the production server after a successful build with `npm run start`.

## Responses

* Keep responses concise and to the point - unless the user ask otherwise

## Planning Mode

- Always ask clarifying questions
- Never assume design, tech stack or feature
- Use deep-dive sub agents to assist with research
- Use deep-dive sub agents to review the different aspects of your plan before presenting to the user

## Change / Edit Mode

* Never implement features yourself when possible - use sub-agents!
* Identify changes from the plan that can be implemented in parallel, and use sub-agents to implement the features efficiently
* When using sub-agents to implement features, act as a coordinator only
* Use the best model for the task - premium models for complex tasks
  (like coding) and mid-tier models for simpler tasks, like documentation
* After completing features (large or small), always run commands like lint, type check and next build to check code quality

## DATABASE SCHEMA CHANGES

* Whenever you make changes to the database schema, ALWAYS run the drizzle generate and migrate commands
* NEVER run drizzle push!
* For all ID columns NOT related to BetterAuth, use UUID for the ID columns and be randomly generated

## TESTING

* Use any testing tools, libraries available to the project for testing your changes
* Never assume your changes simply work, always test!
* If the project does not have any testing tools, scripts, MCP tools,
  skills, etc. available for testing, ask the user whether testing should
  be skipped.

## UI DESIGN

* Always follow the UI design system when creating or reviewing components or pages.
* Design System: @DESIGN.md

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
