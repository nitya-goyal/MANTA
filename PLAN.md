# MANTA MVP

## Product
An evidence-led recovery workspace for independent laptop refurbishers. Demonstrate five devices, a limited repair budget, technician hours, and a verified donor component. Currency: INR.

## Screens and workflow
1. Overview: current batch, estimated recovery, actionable next steps.
2. Inventory: searchable devices; add/edit diagnostic findings and economics.
3. Market evidence: dated source records, supplier/resale classification, manual verification. Seed records are explicitly illustrative.
4. Recovery planner: budget and hours controls, donor eligibility, exact enumeration of feasible repair/sell combinations for up to 12 devices.
5. Review: transparent per-device calculations, explicit approval, CSV export.

## Visual system
Ink/navy sidebar, warm white canvas, teal actions, muted green statuses, orange review states. Spacious desktop workbench; responsive sidebar and cards. Native labelled forms, keyboard-accessible dialogs, visible focus states.

## Implementation
Dependency-free browser application, modular deterministic optimiser, localStorage persistence. Calculate repair recovery as expected resale less parts, labour and selling/warranty allowance. Budget includes parts and labour; technician capacity is separate. A selected donor loses its as-is value and receives its entered residual value. A donor cannot simultaneously be repaired or reused twice. Only technician-confirmed donor matches are eligible. Net recovery excludes acquisition and overhead; no guarantee of realised profit.

## Acceptance
Inputs recalculate feasible plans; zero budget preserves sell-as-is choices; donor use accounts for lost donor proceeds; invalid or unconfirmed matches cannot be used; edits invalidate approval; exports match the current plan; saved inventory survives reload. Test solver independently and inspect responsive UI in browser.

## Explicit next phase
Live TinyFish research requires server-side credentials, a research endpoint, source extraction and review. Authentication, shared database, OCR, automated purchasing, subscriptions and multi-workshop access are outside this local-state MVP. Do not describe fixture evidence as live research.
