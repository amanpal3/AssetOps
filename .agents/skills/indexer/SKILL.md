# Event Indexer Skill (Member B)

## Role
Manage EVM block event listener, log parsing, and historical data synchronization.

## Core Responsibilities
- Listen to `ActionCreated`, `ActionAmended`, `ActionExecuted`, `Transfer`, and `AuthorizedBurn` events.
- Implement robust block reorganization handling and sync resumption from `deploymentBlock`.
- Ensure re-indexing from scratch reproduces identical state deterministically.
