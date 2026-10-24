# MANTA

Laptop refurbishment recovery planning MVP. See PLAN.md for scope and design.

Run `npm start` and open http://127.0.0.1:4173. Run `npm test` for optimiser verification. No dependency installation is needed.

Includes five editable sample devices, inventory search, manual evidence capture, budget and labour constraints, one technician-confirmed donor match, plan approval and CSV export. State is stored in the current browser. Clear the `manta-v1` localStorage entry to reset the sample.

All seeded monetary values are illustrative. The exact optimiser enumerates up to 12 devices and accounts for donor residual value; it is deterministic, not an AI diagnosis. Live TinyFish, OCR, user accounts, server persistence and billing are not connected in this version. No secrets belong in this static client.
