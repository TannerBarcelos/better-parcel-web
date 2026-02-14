# AGENTS.md

## Project Intent
Modern Parcel web client using TanStack Start with dark, sharp-edged UI.

## Tech Stack
- Framework: TanStack Start (React + file-based routing)
- Build tool: Vite 7
- Package manager: `pnpm`
- Data fetching/cache: TanStack Query
- Deployment targets used in this repo: Vercel and Cloudflare Workers tooling

## Design Constraints
- No rounded corners.
- Visual language: black/gray/white, sharp/blocky components.
- Responsive on mobile and desktop.
- Support both light and dark themes.
- Theme behavior:
  - Respect `prefers-color-scheme`.
  - Provide user toggle (sun/moon).
  - Persist theme in local storage.
  - If stored theme differs from current system preference, system preference wins.

## App UX Rules
- Add delivery opens in a modal from dashboard header.
- Delivery details open in a modal from list click (no route navigation).
- Show map in details modal when location is available from tracking events.
- Prefer readable carrier names; map carrier codes via Parcel supported carriers endpoint.
- Filter/group UI should be compact and efficient, opened from a filter trigger.
- Grouping is optional and off by default.
- Filtering/grouping state must persist in URL search params.

## Route Map
- `/`: landing page
- `/sign-in`: API key sign-in
- `/app`: dashboard (deliveries, grouping/filtering, modals)
- `/api/session`: creates/clears auth session cookie
- `/api/deliveries`: Parcel deliveries proxy
- `/api/add-delivery`: Parcel add delivery proxy
- `/api/carriers`: Parcel supported carriers proxy/normalizer

## Data/Auth Architecture
- Never call Parcel API directly from client for authenticated actions.
- Store Parcel API key only in an HTTP-only cookie via `/api/session`.
- Client fetches app data only through internal API routes under `/api/*`.
- Normalize carrier data server-side so client can render friendly names.
- Convert technical upstream errors to user-friendly messages (especially 429 rate limit).

## Query & Caching
- Use TanStack Query for client-side API calls.
- Deliveries query key includes mode: `['deliveries', mode]`.
- Carriers query key: `['carriers']`.
- Current stale-time defaults in app:
  - deliveries: 2 minutes
  - carriers: 24 hours
- After successful add-delivery mutation, invalidate deliveries queries.

## URL Search Contract (`/app`)
- `mode`: `active | recent` (required)
- `group`: `none | carrier | status` (required)
- `carrier`: optional carrier code filter
- `status`: optional status filter

Always preserve required fields when patching search state.

## Parcel Status Mapping
- Status labels should be derived from numeric status codes.
- Status badges are color-coded by status semantic.
- Avoid showing raw integer status codes in UI.

## Build, Run, Deploy
- Install: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm run build`
- Deploy (project script): `pnpm run deploy`

Node requirement: `20.19+` or `22.12+` (Vite 7).

## Contributor/Agent Guardrails
- Prefer modifying existing architecture over adding parallel patterns.
- Keep modals in-place for add-delivery and details flows.
- Keep styling sharp-edged (no border-radius reintroduction).
- When adding API integrations, update both:
  - server route normalization/error handling
  - client-side rendering/types and query usage
- If README instructions change materially, keep this AGENTS file aligned.
