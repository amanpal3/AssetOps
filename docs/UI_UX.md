# AssetOps â€” Master UI/UX Specification

**Project:** AssetOps â€” The Operations Layer for Tokenized Assets  
**Document:** Master UI/UX Specification  
**Status:** Approved visual and interaction direction  
**Product type:** Professional Web3 lifecycle-operations dashboard  
**Primary users:** Issuers, treasury operators, asset-servicing operators, holders, auditors, and demo operators

## 1. Design Direction

AssetOps should feel **calm, precise, trustworthy, and operational**. It is a financial operations product, not a speculative crypto trading interface. The design must communicate that every announcement, payment, amendment, and redemption is controlled and auditable.

The visual direction combines:

- The confident, product-led presentation and generous whitespace seen in [Google Antigravity][1].
- The clear, structured, enterprise-ready communication and restrained visual system seen in [Sarvam AI][2].
- The simple, story-driven, expressive interaction and scroll-based animation approach seen in [Ollivere][3].

These references guide the design language only. AssetOps must have its own visual identity and must not copy their layouts, graphics, logos, or proprietary assets.

> **Design principle:** Make complex on-chain operations feel as clear as a well-designed financial control room.

## 2. Core UX Principles

### 2.1 Clarity before decoration

Every screen must answer three questions quickly:

1. What is the current state?
2. What action can the user take?
3. What evidence confirms the result?

The interface must prioritize readable data, clear hierarchy, and useful status feedback over visual effects.

### 2.2 Trust through visible state

The UI must show the difference between a draft, active, superseded, executed, cancelled, pending, confirmed, and failed state. A user must never need to guess whether a blockchain transaction completed.

### 2.3 Progressive disclosure

Show the important operational summary first. Place technical details such as transaction hashes, block numbers, contract addresses, and event logs behind expandable detail areas.

### 2.4 Motion with purpose

Animation should explain change, guide attention, and confirm interaction. Motion must not delay critical information or make the dashboard feel like a game.

### 2.5 Professional Web3, not crypto noise

Avoid excessive neon colors, speculative language, token-price visuals, dense trading charts, meme imagery, and decorative blockchain clichÃ©s. AssetOps should look suitable for an issuer, treasury team, auditor, or institutional operations group.

### 2.6 Accessible by default

The interface must support keyboard navigation, visible focus states, readable contrast, reduced-motion preferences, responsive layouts, and clear error text.

## 3. Brand Personality

| Attribute   | UI expression                                                               |
| ----------- | --------------------------------------------------------------------------- |
| Reliable    | Stable layouts, explicit states, confirmation evidence, consistent controls |
| Precise     | Tabular data, aligned numbers, basis-point formatting, structured timelines |
| Modern      | Clean typography, restrained gradients, responsive cards, subtle motion     |
| Intelligent | Contextual explanations, useful defaults, progressive disclosure            |
| Human       | Clear language, direct feedback, helpful empty and error states             |
| Operational | Priority queues, upcoming actions, treasury status, audit trails            |

The product should feel **quietly advanced**. It should not announce its technical complexity through decoration.

## 4. Visual System

### 4.1 Color strategy

Use a light-first interface with a warm neutral canvas, deep ink text, cool blue primary actions, and restrained green, amber, and red semantic colors.

| Token           | Suggested value | Use                                           |
| --------------- | --------------- | --------------------------------------------- |
| `canvas`        | `#F7F8FA`       | Main application background                   |
| `surface`       | `#FFFFFF`       | Cards, panels, tables, dialogs                |
| `surface-muted` | `#F0F2F5`       | Secondary panels and disabled areas           |
| `ink`           | `#111827`       | Primary text and headings                     |
| `ink-muted`     | `#667085`       | Supporting text and metadata                  |
| `line`          | `#E4E7EC`       | Borders and dividers                          |
| `primary`       | `#2457D6`       | Primary actions, active links, focus accents  |
| `primary-soft`  | `#EAF0FF`       | Selected states and informational backgrounds |
| `success`       | `#168A5B`       | Confirmed, active, paid, healthy              |
| `success-soft`  | `#E7F6EF`       | Success status backgrounds                    |
| `warning`       | `#B7791F`       | Pending, attention, upcoming                  |
| `warning-soft`  | `#FFF6DE`       | Warning status backgrounds                    |
| `danger`        | `#C2414B`       | Rejected, failed, cancelled                   |
| `danger-soft`   | `#FDECEC`       | Error status backgrounds                      |
| `superseded`    | `#7A5AA6`       | Superseded version indicator                  |

The product must not rely on color alone. Every semantic color must be paired with text, an icon, or a visible state label.

### 4.2 Dark mode

Dark mode is not required for the first MVP. The architecture should use semantic design tokens so dark mode can be added later without rewriting components.

### 4.3 Typography

Use a highly legible sans-serif family for the interface. Recommended choices are **Inter**, **Geist**, or **DM Sans**. Use one primary family rather than mixing several display fonts.

| Level   | Usage                                        | Guidance                                               |
| ------- | -------------------------------------------- | ------------------------------------------------------ |
| Display | Landing-page hero only                       | Large, compact, confident, limited to one or two lines |
| H1      | Page title                                   | Strong but not oversized; identify the page purpose    |
| H2      | Section title                                | Establish clear operational groups                     |
| Body    | Descriptions and guidance                    | Comfortable reading width and line height              |
| Label   | Status, table headings, metadata             | Short, uppercase only when useful                      |
| Data    | Balances, rates, amounts, IDs                | Use tabular numerals and consistent alignment          |
| Code    | Addresses, transaction hashes, contract data | Use a readable monospace font and truncation           |

Avoid all-caps paragraphs. Use sentence case for buttons, headings, navigation, and status descriptions.

### 4.4 Shape and spacing

Use a restrained radius system:

- Small controls: `8px`.
- Cards and panels: `14px`.
- Modals and major containers: `18px`.
- Pills: fully rounded only for compact status tags.

Use an 8-point spacing system with occasional 4-point adjustments for dense data tables. Maintain generous outer margins and avoid filling every empty area.

### 4.5 Borders and shadows

Prefer one-pixel borders and soft, low-opacity shadows. The interface should feel layered but not glossy.

Recommended shadow behavior:

- No shadow for ordinary page sections.
- Very soft shadow for cards that float above the canvas.
- Stronger shadow only for dialogs, menus, and command surfaces.

Avoid heavy glassmorphism, excessive blur, shiny gradients, and decorative 3D surfaces.

## 5. Explicit Visual Exclusions

The following are intentionally not part of the AssetOps design:

- No 3D objects in the background.
- No rotating coins, blocks, chains, cubes, or abstract 3D sculptures.
- No full-screen video background.
- No animated noise that reduces text readability.
- No excessive particle systems.
- No neon cyberpunk theme.
- No fake live market-price charts.
- No decorative animation behind transaction-critical controls.
- No animation that hides or delays a status message.

The product may use flat illustrations, diagrams, line icons, animated timelines, data transitions, and subtle gradients as long as they support comprehension.

## 6. Information Architecture

### 6.1 Primary navigation

The application shell should use a stable left sidebar on desktop and a compact bottom or drawer navigation on mobile.

```text
AssetOps logo

Overview
Assets
Holders
Corporate actions
Payments
Redemptions
Audit history

Settings
Network status
Connected wallet
```

The active navigation item must be visually distinct without relying on animation alone.

### 6.2 Global header

The header should contain:

- Current network badge.
- Search or command shortcut.
- Notification or attention indicator.
- Connected wallet address.
- User or role menu.

The header must always make the current network obvious. Sepolia and local development states must not look identical.

### 6.3 Role-aware navigation

The interface may hide actions that are not available to the connected role, but it must not hide important state from auditors or holders. When a user lacks permission, show a clear explanation rather than a broken or unexplained control.

## 7. Core Screens

### 7.1 Overview dashboard

The overview is the operational starting point. It should show the current state of the asset-servicing system rather than a generic analytics dashboard.

Recommended layout:

```text
Page title: Overview                         Network: Sepolia
Short operational summary                   Wallet: 0xâ€¦91AF

[Total assets] [Upcoming actions] [Treasury balance] [System status]

Next lifecycle action                        Action timeline
CA-001 Â· Coupon Â· 4%                         Created â†’ Amended â†’ Paid
Payable 18 Sep 2026                           Version 1 â†’ Version 2

Current holder distribution                  Recent activity
Alice 500 DBT                                Payment executed
Bob 300 DBT                                  Bob transferred 200 DBT
Charlie 200 DBT                              Version 1 superseded
```

The first screen should make the main story visible: an action was corrected, the current holders are known, and the correct version can be executed once.

### 7.2 Assets screen

Display tokenized assets as clean horizontal cards or a compact table. Each asset should show:

- Name and symbol.
- Total supply.
- Current holder count.
- Active corporate actions.
- Asset status.
- Network and contract address.

The primary action should be **View asset**, not **Mint token**, because the product is positioned around post-issuance servicing.

### 7.3 Asset detail screen

Use a tabbed structure:

```text
Summary | Holders | Actions | Payments | Audit
```

The summary should show supply, status, upcoming action, treasury readiness, and a compact lifecycle visualization.

### 7.4 Holder registry

The holder registry must present ownership clearly and neutrally.

Recommended columns:

| Holder  | Balance | Ownership share | Last transfer       | Eligibility |
| ------- | ------: | --------------: | ------------------- | ----------- |
| Alice   | 500 DBT |          50.00% | â€”                   | Approved    |
| Bob     | 300 DBT |          30.00% | Transfer to Charlie | Approved    |
| Charlie | 200 DBT |          20.00% | Received from Bob   | Approved    |

Use monospace formatting only for wallet addresses. Show a shortened address with a copy control and an explorer link.

### 7.5 Corporate actions screen

This is a core product screen. Present actions as operational records rather than generic cards.

Each row should contain:

- Action ID.
- Type.
- Asset.
- Active version.
- Rate or principal amount.
- Payable date.
- Status.
- Execution state.
- Primary action.

Filters should include action type, status, asset, and date range.

### 7.6 Action detail and version history

The action detail page must make correction history immediately understandable.

Recommended structure:

```text
CA-001                                      ACTIVE
Coupon Â· Demo Bond Token Â· Payable 18 Sep 2026

[Execute active version] [Amend announcement]

Version history

â— Version 2   4%   ACTIVE
â”‚  Corrected 12 Sep 2026 Â· Document hash Â· Transaction
â”‚
â—‹ Version 1   5%   SUPERSEDED
   Created 10 Sep 2026 Â· Document hash Â· Transaction

Execution status
Not executed Â· Treasury funded Â· 3 holders eligible

Audit timeline
Created â†’ Transfer occurred â†’ Amended â†’ Version 1 superseded
```

Use a vertical timeline with a strong active marker and a muted historical marker. The superseded version must remain visible and must never appear deletable.

### 7.7 Payment execution flow

Payment execution must be a guided, review-first flow.

```text
1. Review action
2. Verify active version
3. Verify payable date
4. Verify treasury funding
5. Preview holder entitlements
6. Confirm wallet transaction
7. Wait for confirmation
8. View payment receipt and audit evidence
```

Before the final confirmation, show:

| Holder  | Balance | Rate | Estimated payment |
| ------- | ------: | ---: | ----------------: |
| Alice   | 500 DBT |   4% | 20 payment tokens |
| Bob     | 300 DBT |   4% | 12 payment tokens |
| Charlie | 200 DBT |   4% |  8 payment tokens |

The confirmation control should identify the exact action and version: **Execute CA-001 Version 2**. Never use a vague label such as **Confirm**.

### 7.8 Redemption flow

Redemption requires stronger emphasis because it closes the asset lifecycle.

Show:

- Maturity status.
- Current holder balances.
- Principal per token.
- Total principal required.
- Treasury balance.
- Tokens to be burned.
- Irreversible-action warning.
- Final transaction state.

The UI must explicitly state that redemption pays holders and burns redeemed asset tokens. The warning should be clear but not alarmist.

### 7.9 Audit history

The audit screen should be chronological, filterable, and evidence-oriented.

Each record should display:

- Event type.
- Human-readable description.
- Actor or wallet.
- Timestamp.
- Block number.
- Transaction hash.
- Related asset and action.
- Explorer link.

Use plain language alongside technical details. For example:

> **Version 1 superseded** â€” CA-001 changed from 5% to 4% by `0xâ€¦91AF`.

### 7.10 Guided demo mode

Provide a focused demo mode that tells the project story in sequence:

```text
Create asset â†’ Distribute â†’ Announce â†’ Transfer â†’ Amend â†’ Execute â†’ Replay rejection â†’ Redeem
```

Each step should have:

- A short explanation.
- Current state.
- Required action.
- Transaction control.
- Success evidence.
- Next-step navigation.

The demo mode should be useful for presentations without making the production dashboard feel like a tutorial.

## 8. Component System

### 8.1 Buttons

Use three levels:

| Type      | Use                                                         |
| --------- | ----------------------------------------------------------- |
| Primary   | One main action per section, such as Execute active version |
| Secondary | Supporting actions, such as View details or Amend           |
| Tertiary  | Low-emphasis links, filters, and navigation                 |

Destructive or irreversible controls must use a distinct danger style and a precise label.

### 8.2 Status badges

Use compact badges with both color and text:

```text
ACTIVE
PENDING
CONFIRMED
SUPERSEDED
EXECUTED
CANCELLED
FAILED
```

Avoid ambiguous labels such as `Done`, `Live`, or `Error` when a more precise lifecycle term exists.

### 8.3 Cards

Cards should group one operational concept. Do not use cards as decoration. Every card must have a useful title, a clear value, and an obvious relationship to the surrounding workflow.

### 8.4 Tables

Tables are preferred for holders, actions, payments, and audit records. Use right alignment for numeric values and consistent decimal precision.

On mobile, transform lower-priority columns into expandable detail rather than forcing horizontal scrolling for every table.

### 8.5 Timeline

Use timelines for lifecycle and audit history. The timeline must distinguish:

- Completed events.
- Current state.
- Superseded history.
- Pending future events.
- Failed attempts.

### 8.6 Dialogs and drawers

Use dialogs for confirmation and drawers for contextual details. A dialog should contain one decision. Avoid multi-step forms inside a tiny modal.

## 9. Animation System

Animation is permitted and encouraged when it improves orientation, feedback, or storytelling. It must remain subtle and fast.

### 9.1 Motion principles

- Animate state changes, not static decoration.
- Keep essential information visible before motion completes.
- Use consistent easing and duration.
- Respect `prefers-reduced-motion`.
- Avoid infinite loops except for a small loading indicator.
- Never use motion to conceal a failed transaction.

### 9.2 Recommended motion patterns

| Interaction           | Animation                                                              |
| --------------------- | ---------------------------------------------------------------------- |
| Page entry            | Short fade and upward movement for the content group                   |
| Card entry            | Staggered reveal of key cards, limited to 3â€“5 elements                 |
| Tab change            | Crossfade or short horizontal transition                               |
| Timeline update       | Draw the new event line and reveal the event label                     |
| Version amendment     | Move the active marker to Version 2 and soften Version 1 to superseded |
| Payment preview       | Count values into final positions without excessive odometer effects   |
| Transaction pending   | Compact progress indicator with step labels                            |
| Transaction confirmed | Brief check transition followed by a persistent confirmation state     |
| Duplicate rejection   | Small shake or red boundary pulse followed by a clear explanation      |
| Copy address          | Small tooltip or icon confirmation                                     |
| Toast notification    | Slide in, remain long enough to read, then leave gently                |

### 9.3 Timing guidance

| Motion type                   |   Duration |
| ----------------------------- | ---------: |
| Micro interaction             | 120â€“180 ms |
| Button and control transition | 160â€“220 ms |
| Panel or modal entrance       | 220â€“320 ms |
| Page section reveal           | 320â€“500 ms |
| Data or timeline transition   | 400â€“700 ms |

Do not animate blockchain confirmation as if it were instant. The interface must show a real pending state while waiting for the transaction.

### 9.4 Landing-page motion

The public landing page may use a restrained scroll narrative:

```text
The asset is issued
    â†“
Ownership changes
    â†“
Announcement is corrected
    â†“
The correct holders are paid
    â†“
The asset is redeemed and closed
```

Use animated lines, flat nodes, text transitions, and data panels. Do not use 3D objects or a 3D blockchain visualization.

## 10. Landing Page Structure

The landing page should be concise and story-driven.

### Hero

**Headline:**

> Tokenized assets need operations after issuance.

**Supporting copy:**

> AssetOps manages holders, corporate actions, corrected announcements, payments, redemption, and audit history in one verifiable workflow.

**Primary CTA:** `Explore the demo`

**Secondary CTA:** `View the lifecycle`

### Problem section

Explain that issuance is only the beginning. Use a simple flat visual showing the operational sequence after minting.

### Product lifecycle section

Show the full journey:

```text
Issue â†’ Hold â†’ Announce â†’ Amend â†’ Pay â†’ Audit â†’ Redeem
```

### Core proof section

Present three proof points:

- Current holder state.
- Versioned announcements.
- One-time execution.

### Demo section

Use the CA-001 scenario as the product proof. Show the change from 5% to 4%, the transfer from Bob to Charlie, and the final 20 / 12 / 8 payment distribution.

### Trust section

Explain:

- On-chain authority.
- Append-only version history.
- Atomic execution.
- Rebuildable audit history.

### Final CTA

> Make the lifecycle as reliable as the issuance.

CTA: `Open AssetOps demo`

## 11. UX Writing Standards

Use short, direct, operational language.

| Avoid                | Use instead                                 |
| -------------------- | ------------------------------------------- |
| Do transaction       | Execute payment                             |
| Something went wrong | Payment could not be executed               |
| Success              | CA-001 Version 2 executed                   |
| Error                | Execution rejected: action already executed |
| Live                 | Active                                      |
| Old version          | Superseded Version 1                        |
| Wallet               | Connected wallet                            |
| Submit               | Create announcement                         |

Error messages should explain the reason and the next possible action.

Example:

> **Action already executed.** CA-001 Version 2 has already paid its eligible holders. No funds were transferred in this attempt.

## 12. Web3 Transaction UX

Every write transaction must have four visible states:

```text
Ready â†’ Wallet request â†’ Pending confirmation â†’ Confirmed or Failed
```

The interface must:

- Identify the network before signing.
- Identify the exact contract action before signing.
- Keep the user on the relevant page while pending.
- Display the transaction hash after submission.
- Link to the block explorer after confirmation.
- Explain rejected user signatures separately from reverted contract calls.
- Explain expected security rejections such as duplicate execution.
- Avoid claiming success before the required confirmation is received.

## 13. Responsive Design

### Desktop

Use a persistent sidebar, wide data tables, two-column operational panels, and a maximum content width that preserves readable line length.

### Tablet

Collapse the sidebar into a drawer. Keep summary cards in a two-column grid and move secondary information into expandable panels.

### Mobile

Prioritize one action per screen. Use stacked cards, horizontally scrollable tab controls, compact tables with detail expansion, and a sticky bottom action area for critical flows.

The mobile layout must preserve the action ID, version, status, and primary action without requiring the user to open multiple panels.

## 14. Accessibility Requirements

The MVP must:

- Meet WCAG 2.2 AA targets where practical.
- Provide keyboard navigation for all controls.
- Provide visible focus indicators.
- Use semantic headings and landmarks.
- Associate labels with form controls.
- Provide text alternatives for icons.
- Maintain adequate contrast.
- Avoid color-only status communication.
- Respect `prefers-reduced-motion: reduce`.
- Announce transaction state changes to assistive technologies.
- Keep tap targets large enough for touch use.

## 15. UI/UX Acceptance Criteria

The interface is accepted when:

- The dashboard clearly shows the connected network and wallet.
- Users can see current asset holders and balances.
- Users can distinguish Version 1 from Version 2.
- Version 1 remains visibly marked `SUPERSEDED`.
- Only Version 2 presents an executable action control.
- Payment preview shows the current holder distribution.
- The transfer from Bob to Charlie is visible in the history.
- The payment result shows Alice 20, Bob 12, and Charlie 8 payment tokens for the 4% example.
- A duplicate execution attempt is displayed as an expected security rejection.
- Redemption clearly explains payment and token burning.
- Every confirmed action has a transaction hash and explorer link.
- Pending, confirmed, failed, and rejected states are distinct.
- The interface works on desktop and mobile layouts.
- No 3D background objects are used.
- Animation supports comprehension and respects reduced-motion preferences.
- The public landing page communicates the post-issuance lifecycle within the first screen.

## 16. Implementation Guidance

The frontend should implement the design through reusable tokens and components rather than page-specific styling.

Recommended component groups:

```text
components/
â”œâ”€â”€ layout/
â”‚   â”œâ”€â”€ AppShell
â”‚   â”œâ”€â”€ Sidebar
â”‚   â”œâ”€â”€ Topbar
â”‚   â””â”€â”€ MobileNav
â”œâ”€â”€ data-display/
â”‚   â”œâ”€â”€ StatCard
â”‚   â”œâ”€â”€ DataTable
â”‚   â”œâ”€â”€ StatusBadge
â”‚   â”œâ”€â”€ AddressDisplay
â”‚   â”œâ”€â”€ Timeline
â”‚   â””â”€â”€ EmptyState
â”œâ”€â”€ lifecycle/
â”‚   â”œâ”€â”€ ActionCard
â”‚   â”œâ”€â”€ VersionChain
â”‚   â”œâ”€â”€ PaymentPreview
â”‚   â”œâ”€â”€ RedemptionSummary
â”‚   â””â”€â”€ LifecycleStepper
â”œâ”€â”€ transaction/
â”‚   â”œâ”€â”€ TransactionButton
â”‚   â”œâ”€â”€ TransactionStatus
â”‚   â”œâ”€â”€ ConfirmationDialog
â”‚   â””â”€â”€ ExplorerLink
â””â”€â”€ motion/
    â”œâ”€â”€ PageReveal
    â”œâ”€â”€ StaggerList
    â””â”€â”€ StateTransition
```

Use CSS transitions and lightweight animation utilities before adding a large animation library. Introduce a library only when it materially improves timeline, layout, or state-transition behavior.

## 17. Design Review Checklist

Before accepting a screen or component, ask:

- Is the primary user action obvious?
- Is the current state visible without opening a menu?
- Can a user understand the result without knowing Solidity?
- Are action IDs, versions, rates, balances, and dates formatted consistently?
- Are technical details available without overwhelming the main view?
- Does the screen show enough evidence for an auditor?
- Is the animation useful or merely decorative?
- Does the screen work with reduced motion?
- Is the page usable on mobile?
- Does the interface avoid 3D background objects and crypto clichÃ©s?
- Does the design match the AssetOps brand: calm, precise, professional, and trustworthy?

## 18. References

[1]: https://antigravity.google/ "Google Antigravity"
[2]: https://www.sarvam.ai/ "Sarvam AI"
[3]: https://ollivere.co/ "Ollivere Digital Product, UX and Branding"
[4]: ./PRD.md "AssetOps Product Requirements Document"
[5]: ./architecture.md "AssetOps System Architecture"
[6]: ./technology.md "AssetOps Master Technology Specification"
[7]: https://www.w3.org/WAI/standards-guidelines/wcag/ "W3C Web Content Accessibility Guidelines"
