# gynx-panel — remaining work

Session-by-session progress. Each item names the scope, not the implementer; most land as one focused PR.

## shipped

### session 1 (f60ca508 and earlier)
- Design system scaffold (tokens, fonts, globals).
- App shell: Sidebar + TopBar + AppShell composer.
- Server Console page redesigned end-to-end.
- Button system restyled across the whole panel.
- `install-bundle.sh` / `uninstall-bundle.sh`.

### session 2 (current)
- **Design realignment** to the strict 80/15/5 rule — "glow is a reward, not a default." Stripped ambient gradient blobs from the canvas, replaced with a subtle dark-slate gradient + structural grid + noise overlay. Panels default to flat `#1F2937` with `rgba(255,255,255,0.05)` edges; hover reveals the purple edge + lift.
- **Metric-aware stat tiles** — CPU blue, RAM purple, Disk yellow, Network cyan, Status green. Progress bars appear when a tile has a defined limit. Severity prop flips the accent to yellow/red on threshold cross.
- **ServerDetailsBlock reordered** — Status (prominent) → Connection (IP + copy) → CPU / RAM / Disk / Network, stacked vertically in the right column.
- **Unified ChartPanel** with CPU / RAM / Network tabs (replaces the three side-by-side chart blocks). Taller chart body for readability, metric-tinted line per tab.
- **Terminal chrome** stripped of default glow — `#05070B` background, neutral edge, purple ring only on input focus.
- **Top-nav tabs** icon + group labels (`manage` / `monitor` / `config`). Active tab = purple pill, hover = blue flash.
- **SubNavigation strip** restyled with glassy backdrop + purple pill for the active tab.
- **Egg Switcher design doc** at `docs/EGG_SWITCHER.md` — full architecture, API spec, data model, build phases. Nothing implemented yet.

---

## next up — UI polish

### P0 — high-traffic, visibly stock

- [ ] **Dashboard** (`resources/scripts/components/dashboard/DashboardContainer.tsx` + `ServerRow.tsx`).
  - Server row → a glassy card with the same severity-bar treatment as StatBlock (status-green / warn-yellow / off-gray).
  - Server avatar: switch from boring-avatar to a gradient monogram of the server name initial.
  - Hover: `translateY(-2px)` + purple edge glow (reuse `gynx-panel-hoverable`).
  - Empty state: centered illustration + "Deploy your first server" CTA (use pink `gynx-btn-destructive` for the rare case).

- [ ] **File Manager** (`resources/scripts/components/server/files/`).
  - Breadcrumb row: pill-style, gradient-underline on the active segment.
  - File row: blue row-hover (matches new sub-nav), left-side file-type icon badge, right-aligned quick actions revealed on hover.
  - Upload zone: flat panel default, cyan border when dragging.

- [ ] **Auth pages** (`resources/scripts/routers/AuthenticationRouter.tsx` + `components/auth/`).
  - Centered panel on the now-minimal background (no more gradient blobs).
  - Logo above the form, tagline below.
  - Input group: purple focus ring + glow on focus *only*.

### P1 — frequently used

- [ ] **Databases** — card treatment + copy-host/port/user/pass.
- [ ] **Schedules** — per-schedule card with next-fire pill.
- [ ] **Backups** — progress bar during backup creation (cyan fill); destructive delete in pink.
- [ ] **Account Overview**.
- [ ] **Dashboard activity log** — timeline treatment.

### P2 — settings surfaces

- [ ] Users / Subusers, Network / Allocations, Startup, Settings, API Keys, SSH Keys, Activity Log.

### cross-cutting polish

- [ ] **Alerts / flash messages** — metric-tinted left bar (info=blue, success=green, warn=yellow, error=red), flat background.
- [ ] **Dialog** — larger radius, no default glow. Confirm buttons: primary=purple, destructive=pink.
- [ ] **Inputs** — focus ring audit across all types (text, select, textarea, file).
- [ ] **Loading / Spinner** — replace with the `.gynx-shimmer` skeleton pattern where it fits; keep the spinner for indeterminate waits but recolor to purple.
- [ ] **ScreenBlock** (NotFound / ServerError) — flat bg, centered panel, gx monogram.
- [ ] **i18n** — pull hard-coded strings (`manage` / `monitor` / `config`, `server`, `you`, `workspace`) into locale files.
- [ ] **Terminal log coloring** — wire info/ok/warn/err CSS classes into `Console.tsx` by detecting log level from line content. Classes already exist in `tailwind.css`.
- [ ] **Fade-in for new terminal lines** — `.gynx-fade-in` class ready; needs hook-in at `Console.tsx`.

---

## next up — Egg Switcher (see [docs/EGG_SWITCHER.md](docs/EGG_SWITCHER.md))

Implementation phases. Each is a self-contained PR.

- [ ] **Phase 1 — migrations + models**. Three tables (`egg_switch_rules`, `server_egg_switch_overrides`, `egg_switch_logs`), Eloquent models, relationship tests. Backend-only, invisible.
- [ ] **Phase 2 — service layer + policies + permission key**. `EggSwitcherService`, `EggSwitchPolicy`, `control.egg-switch` permission.
- [ ] **Phase 3 — client API endpoints**. Four endpoints (§3.4 of the doc). Feature + unit tests.
- [ ] **Phase 4 — React feature**. Egg picker grid, confirm dialog, progress panel. Ships behind `GYNX_EGG_SWITCHER=1` feature flag.
- [ ] **Phase 5 — admin Blade UI**. Global rules page + per-server overrides tab.
- [ ] **Phase 6 — audit log surfacing**. Read endpoint + history drawer on the Game page.
- [ ] **Phase 7 — `install-full.sh`**. Full-stack deploy script (vs the assets-only `install-bundle.sh`).
- [ ] **Phase 8 — remove feature flag**. Ship to prod.

Rough budget: ~8–10 focused sessions for the whole Egg Switcher.

---

## operational / deploy

- [ ] **CI build** — GitHub Action that runs `yarn build:production` on push to main and uploads `public/assets/` as an artifact. Makes deploys on Node-less panel hosts trivial.
- [ ] **Upstream merge rehearsal** — first real sync against the next `pterodactyl/panel:v1.11.x` tag. Document the conflict areas for the runbook.
- [ ] **Staging panel** — a throwaway Pterodactyl on a scratch VM with a test server, so design iteration stops being blind.

---

## known bugs

- [ ] **Dashboard `ServerCard` remount loop** — symptom: status pill stuck on "connecting" forever, network tab floods with thousands of `/resources` requests within seconds (often hitting the 429 rate limiter and 5xx-ing the panel). Workaround in place at `resources/scripts/components/dashboard/ServerCard.tsx`: module-scoped `INFLIGHT` Set + `NEXT_ALLOWED` Map + `STATS_CACHE` Map keep the request rate bounded and persist last-known stats across remounts so the pill stays accurate. The actual remount loop hasn't been pinpointed.
  - **What we know**: `/api/client/servers/{uuid}/resources` returns valid data (`object: 'stats'`, `attributes.current_state` populated). Bug is purely client-side — `useState(null)` resets stats on every remount, and the component is being remount-cycled by something upstream.
  - **What we ruled out**: response shape (verified by hand-fetching from console — clean), polling interval (was 10s, bumped to 15s with no change), in-flight guards via useRef (got reset on every remount).
  - **Likely culprits to investigate next**: (1) `useSWR` revalidation in `DashboardContainer` swapping the `servers` array reference with each fire and somehow tripping a Suspense / error boundary above `<Pagination>`; (2) the `RouteFader` in `AppShell.tsx` keying on `location.pathname` while `DashboardContainer` calls `window.history.replaceState` on every page change; (3) an upstream React error being swallowed by an error boundary that silently rebuilds the subtree.
  - **Repro**: on the staging panel with two or more servers, watch DevTools → Network. Inflight rate jumps within seconds even with the cache fix; the cache fix only hides the visible symptom.

- [ ] **Slow `/resources` proxy** — related to the above. Even when a single request makes it through, response time is consistently ~10–20 seconds. That's panel → Wings, not Wings itself (verified by hand-`curl` from the VPS). Probably PHP-FPM / cURL config, possibly DNS resolution latency for the node FQDN. Once the remount loop is fixed, this becomes the next bottleneck.

---

## explicit non-goals

- Light-theme variant.
- Admin panel redesign (AdminLTE stays).
- Replacing Chart.js.
- "Performance mode" toggle (design spec §12) — deferred until the activity pulse feature in §12 is in scope; solo toggle with no feature to toggle adds UI for no benefit yet.
