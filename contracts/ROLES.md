# AssetOps contract roles

Smart contracts are the only financial authority. Frontend, API, and database
never grant, mint, pay, burn, or mark an action executed.

## Roles

| Role | Contract | Capability |
| --- | --- | --- |
| `DEFAULT_ADMIN_ROLE` | All | Grant and revoke roles; critical administration |
| `MINTER_ROLE` | `SecurityToken`, `PaymentCurrency` | Mint the asset token or mock payment currency |
| `AGENT_ROLE` | `SecurityToken` | Allowlist maintenance, pause, unpause |
| `BURNER_ROLE` | `SecurityToken` | `burnFromHolder` during redemption. Grant this to `PaymentExecutor` |
| `ANNOUNCER_ROLE` | `CorporateActionRegistry` | Create, amend, and cancel corporate actions |
| `EXECUTOR_ROLE` | `CorporateActionRegistry`, `PaymentExecutor` | Execute payable actions and mark versions `EXECUTED` |
| `TREASURY_ROLE` | `PaymentExecutor` | Set the treasury address that funds payouts and ERC-20 allowances |

## Hackathon demo

One deployer account may hold several roles so a single wallet can run the
Sepolia walkthrough.

## Production

Separate admin, issuer/announcer, agent, treasury, executor, and burner
controllers. Use multisignature (or equivalent) governance for
`DEFAULT_ADMIN_ROLE` and any role that can move funds or burn asset tokens.

`PaymentCurrency` is mock demo money. It is not USD and must not hold customer
funds.
