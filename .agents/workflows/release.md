# Release Workflow

1. Ensure all features for release are merged into `develop`.
2. Run full regression test suite locally and on CI.
3. Deploy contracts to Sepolia via `scripts/deploy.ts`.
4. Update `deployments/sepolia.json` with deployed addresses and block numbers.
5. Seed demo state on Sepolia: `scripts/seed-demo.ts`.
6. Run `scripts/verify-deployment.ts`.
7. Merge `develop` into `main` and tag the release version.
