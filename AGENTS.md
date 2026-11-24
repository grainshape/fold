# AGENTS.md

Conventions for agents working in this repository.

## Setup

- Use `pnpm`, never npm or yarn. The repo pins pnpm 12.23.0 through `packageManager` in the root `package.json`.
- Development needs Node `^22.12.0 || ^24.0.0 || >=26.0.0` (the `engines` field in the root `package.json`), because that's what Vite, Vitest and Changesets support. The published packages have no Node requirement.
- Packages allowed to run install scripts are listed under `allowBuilds` in `pnpm-workspace.yaml`. pnpm 12 no longer reads the `"pnpm"` field in `package.json`.

## Structure

pnpm workspaces with Turborepo.

```
packages/
  fold/     → @grainshape/fold     framework-agnostic variant-class resolver (all logic in src/fold.ts)
  tw-fold/  → @grainshape/tw-fold  fold with tailwind-merge as its onResolve hook
```

`tw-fold` depends on `fold` through `workspace:*` and imports its built `dist/`. Turbo builds `fold` first for every task (`dependsOn: ["^build"]`). If you run Vitest inside `tw-fold` directly, build `fold` first.

## Commands

Run these from the repo root.

```bash
pnpm build          # build all packages
pnpm test           # run tests, including type tests
pnpm typecheck      # type-check the source (tests are type-checked by pnpm test)
pnpm lint           # ESLint
pnpm format         # format with Prettier
pnpm format:check   # check formatting without writing
pnpm bench          # benchmarks, one package at a time
pnpm dev            # watch builds
pnpm clean          # remove dist/
```

Add `--filter @grainshape/fold` (or `@grainshape/tw-fold`) to run a task for one package. Put extra Vitest flags straight after the script name, without `--`, because pnpm would pass the `--` on to Vitest:

```bash
pnpm --filter @grainshape/fold test --reporter=verbose
pnpm --filter @grainshape/fold exec vitest run src/utils.test.ts   # a single test file
```

Before committing, run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm format:check`.

## Tests

- Test files are type-checked as part of `pnpm test`, so `expectTypeOf` and `@ts-expect-error` assertions fail the run when a type breaks. Vitest uses each package's `tsconfig.test.json`, because `tsconfig.json` excludes tests from the build.
- The public types (`VariantProps`, the `fold()` config and props, `partition`, `compose`) are part of the API. Change them only on purpose. The type tests in `packages/fold/src/fold.test.ts` guard them.

## Behaviour to keep in mind

- `fold()` and `compose()` cache results per recipe (up to 256 entries). `onResolve` runs once per unique class string per recipe, so it must stay a pure function, and a recipe's config is treated as fixed once passed to `fold()`.
- Variant values are compared as text: `true` and `'true'` behave the same in variant lookups and in compound conditions, single values and arrays alike.

## Code style

- TypeScript in strict mode with ES modules and `"module": "NodeNext"`. Relative imports need a `.js` extension, in tests too.
- No `any`, except in the type machinery of `fold.ts` and `utils.ts`, where ESLint allows it. Elsewhere use `unknown` and narrow it.
- Prettier formats everything (`.prettierrc.json`: single quotes, no semicolons, trailing commas, 100 characters). Don't hand-format; run `pnpm format`.
- Add formatting-only commits to `.git-blame-ignore-revs`, so `git blame` skips them.

## Commits and releases

- Conventional commits, enforced by commitlint (`@commitlint/config-conventional`) in a Husky `commit-msg` hook: `type(scope): description`, in the present tense. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Scopes are usually `fold` or `tw-fold`.
- A change to a published package needs a changeset in `.changeset/`. `pnpm changeset` asks questions interactively; writing the file by hand works too.
- Releases run in GitHub Actions (`.github/workflows/release.yml`). When changesets reach `main`, the workflow opens a "chore: version packages" pull request with the version bumps and changelogs. Merging it checks, builds and publishes the new versions to npm, then creates git tags and GitHub releases.
- npm publishing uses trusted publishing: npm trusts that workflow file, so there's no npm token in the repository or its secrets. Don't add one. `pnpm release` publishes from a local machine and is only a fallback; it asks for the npm passkey in the browser.
