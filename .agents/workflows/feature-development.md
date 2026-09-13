# Feature Development Workflow

1. Create a feature branch from `develop`: `git checkout -b feature/<name>`
2. Read the corresponding requirement in `docs/PRD.md` or `docs/ARCHITECTURE.md`.
3. Implement changes in the respective package (`contracts/`, `frontend/`, or `backend/`).
4. Write corresponding unit and integration tests.
5. Run tests locally and verify passing status.
6. Open a pull request targeting `develop` using `pull_request_template.md`.
7. Request review from the designated area owner.
