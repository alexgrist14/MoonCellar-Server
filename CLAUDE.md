# MoonCellar-Server

## Package manager

This project uses **bun** exclusively. Using `npm` is forbidden.

- Install dependencies with `bun install` (never `npm install`).
- Add/remove packages with `bun add` / `bun remove`.
- Run scripts with `bun run <script>` (or `bunx` for one-off binaries).
- Do not create or commit `package-lock.json` — only `bun.lock`/`bun.lockb` is allowed.

## Code generation

- Do not add comments when generating or modifying code.

## Zod schemas

- The zod schema files in `MoonCellar-Server/src/shared/zod/schemas/` and
  `MoonCellar/src/lib/shared/lib/schemas/` are byte-identical copies. The server copy is
  canonical — `createZodDto` generates the NestJS DTOs from it.
- Any change to a schema must be applied to both copies in the same change, byte for byte.
- Verify with `bun run check:schemas`.
- `igdb.schema.ts` is client-only and exempt.
