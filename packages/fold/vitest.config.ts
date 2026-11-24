import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Also type-check the test files, so expectTypeOf and @ts-expect-error assertions are enforced.
    // tsconfig.json excludes tests from the build, so the type check uses tsconfig.test.json.
    typecheck: {
      enabled: true,
      include: ['src/**/*.test.ts'],
      tsconfig: './tsconfig.test.json',
    },
  },
})
