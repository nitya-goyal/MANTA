# MANTA demo showcase

**Pitch:** MANTA helps laptop refurbishers decide what to repair, sell as-is, or use as a donor when budget and technician time are limited.

- [Start the guided demo](https://nitya-goyal.github.io/MANTA/?demo=1#overview)
- [Open the regular workspace](https://nitya-goyal.github.io/MANTA/)
- [Source code](https://github.com/nitya-goyal/MANTA)
- [Project workbook](https://docs.google.com/spreadsheets/d/1oj8FATKj8CYzhGJNuoylcd8ZvrJUCBWpSEDQVZoAVKk/edit#gid=427612516) — access follows its existing Drive permissions.

## Three-minute walkthrough

| Time | Screen and action | What to explain |
| --- | --- | --- |
| 0:00–0:25 | Open guided demo / Overview | Five sample laptops; ₹6,500 budget and 8 technician hours. Selling all as-is yields ₹21,500; the sample plan estimates ₹36,000 net recovery. |
| 0:25–0:55 | Inventory | Show the different faults. Diagnosis and prices are editable inputs, not automatically verified facts. |
| 0:55–1:15 | Market evidence | No fabricated source records. Explain manual dated observations, reviewed before editing inventory estimates. |
| 1:15–2:10 | Recovery planner | Change budget to ₹3,000, then restore ₹6,500. Toggle donor confirmation to show the effect of a technician-verified RAM transfer. Restore confirmation for the closing result. |
| 2:10–2:45 | Plan review | Three repairs, one donor, one as-is sale. Explain ₹5,900 repair spend, 5.5 hours, and ₹14,500 uplift. Review and export the CSV. |
| 2:45–3:00 | Close | Show the repository and roadmap. The public demo is browser-only; shared workshop accounts are a separate local prototype. |

## Demo handling

The `?demo=1` link starts from the fixed sample and never writes it to the saved browser workspace. Edits last until refresh. Exit returns to the normal workspace. Downloads are still available. Keep the original demo tab open throughout the presentation to retain any scenario changes.

Before presenting, check the page loads, keep the sample budget and donor setting at their starting values, and rehearse the CSV export. Use a fresh guided-demo URL for each rehearsal. Do not present the spreadsheet's standalone repair formulas as the batch optimiser; they exclude donor allocation and resource constraints.

## Claims and limits

- Results are illustrative estimates, not measured savings or guaranteed profit.
- Recovery excludes acquisition costs and overhead, and assumes successful repairs and sales.
- The optimiser is deterministic and supports up to 12 devices with one confirmed donor relationship.
- Market evidence is manual. Live research, OCR, hosted accounts, and automatic spreadsheet syncing are not connected.
- Local backend: run `npm run workshop` to demonstrate accounts, invitations, shared SQLite storage and conflicting-save protection separately. Do not imply that the GitHub Pages demo provides those features.

## Next milestones

1. Evidence editing and clearer estimate review.
2. Actual repair/resale outcomes versus estimates.
3. Account recovery, verification, member management and deployment hardening.
4. Hosting and backup configuration, followed by shared-mode deployment.
5. Optional live research after provider and cost decisions.
