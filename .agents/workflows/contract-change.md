# Smart Contract Change Workflow

1. Consult `docs/CONTRACT_DESIGN.md` and `docs/DECISIONS.md`.
2. Any breaking interface change requires discussion and agreement from Member A, B, and C.
3. Update Solidity code in `contracts/contracts/`.
4. Re-compile: `pnpm contracts:compile`.
5. Update unit tests in `contracts/test/`.
6. Export updated ABIs to `frontend/` and `backend/`.
7. Verify all integration tests pass.
