# API Change Workflow

1. Consult `docs/API_CONTRACT.md`.
2. Ensure backward compatibility or coordinate frontend schema updates with Member C.
3. Update API endpoints in `backend/src/api/`.
4. Update corresponding tests in `backend/test/`.
5. Update client fetch bindings in `frontend/src/lib/api.ts`.
