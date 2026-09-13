# Security & Threat Defense Skill (Member A)

## Role
Verify protocol-level defenses and adherence to `docs/SECURITY.md`.

## Core Responsibilities
- Prevent unauthorized minting, pausing, or burning.
- Audit contract access control modifiers (`onlyRole`).
- Verify no secrets (private keys, mnemonics, API tokens) are committed.
- Verify safe ERC-20 transfers (`SafeERC20`) and non-reentrancy on state-changing methods.
