# AGENTS.md

## Project Intent
Modern Parcel web client using TanStack Start with dark, sharp-edged UI.

## Design Constraints
- Dark mode only.
- No rounded corners.
- Visual language: black/gray/white, sharp/blocky components.
- Responsive on mobile and desktop.

## App UX Rules
- Add delivery opens in a modal from dashboard header.
- Delivery details open in a modal from list click (no route navigation).
- Show map in details modal when location is available from tracking events.
- Prefer readable carrier names; map carrier codes via Parcel supported carriers endpoint.

## Technical Notes
- Use server routes for Parcel API access.
- Keep API key in HTTP-only cookie only.
- Prefer `pnpm` for scripts.
