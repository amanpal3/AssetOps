# Testing Workflow

1. Unit tests: `pnpm contracts:test`
2. Backend tests: `pnpm --filter backend test`
3. End-to-end integration test: `pnpm test:e2e`
4. Lint and formatting: `pnpm lint`
5. Verify build succeeds across all workspaces: `pnpm build`
