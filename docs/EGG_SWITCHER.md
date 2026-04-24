# Egg Switcher — architecture & integration plan

A **customer-facing feature** that lets a server owner convert their existing server to a different game without filing a support ticket. Pterodactyl already supports "reinstalling" a server into the same egg; this extends that machinery to *change the egg*, with policy, safety, and UI on top.

> **Status**: design doc only. Nothing in this file is implemented yet. See §9 "Build phases" at the bottom for the proposed sequence of PRs.

---

## 1. Why not just use "Reinstall"?

Pterodactyl's `/servers/{id}/reinstall` endpoint re-runs the *current* egg's install script. It can't change `egg_id`, can't swap the Docker image, can't change environment variable schemas. It also isn't user-gated — on a client the "Reinstall" button is available without any allowlist. We want:

- A curated list of "allowed destination eggs" per source egg (or per server / per user).
- A confirmation step with a clear data-preservation mode ("wipe" vs "keep files").
- An audit trail (who switched what, when, from where → to where).
- Rate limiting so a compromised account can't thrash a server's disk.

That's the shape of the feature.

---

## 2. Data model

### 2.1 New tables

#### `egg_switch_rules`

Defines which egg *transitions* customers are allowed to make. Admin-managed.

| column                  | type                             | notes                                                                                         |
|-------------------------|----------------------------------|-----------------------------------------------------------------------------------------------|
| `id`                    | `bigint unsigned`                | PK                                                                                            |
| `source_egg_id`         | `int unsigned` nullable          | if null = applies to *any* source egg (global allowance)                                      |
| `target_egg_id`         | `int unsigned`                   | FK → `eggs.id`, ON DELETE cascade                                                             |
| `preserves_files`       | `boolean` default `false`        | if false, the switch wipes `/home/container` before the new egg's install runs                |
| `cooldown_minutes`      | `int unsigned` default `0`       | minimum elapsed time between switches on the same server                                      |
| `warning_copy`          | `text` nullable                  | admin-editable warning shown in the confirm dialog (e.g. "switching to Vanilla wipes mods")   |
| `enabled`               | `boolean` default `true`         |                                                                                               |
| `created_at / updated_at` | timestamps                     |                                                                                               |

Uniqueness: `(source_egg_id, target_egg_id)` — one rule per pair. Null source means "from anywhere."

#### `server_egg_switch_overrides`

Optional per-server override — admins can grant or deny a switch for a specific server regardless of the global rule.

| column            | type              | notes                                 |
|-------------------|-------------------|---------------------------------------|
| `id`              | `bigint unsigned` | PK                                    |
| `server_id`       | `int unsigned`    | FK → `servers.id`                     |
| `target_egg_id`   | `int unsigned`    | FK → `eggs.id`                        |
| `allowed`         | `boolean`         | `true` → grant even if no rule exists; `false` → deny even if a rule exists |
| `preserves_files` | `boolean` nullable| overrides the rule's setting when non-null |
| `reason`          | `text` nullable   | admin note, surfaced in audit log     |
| `created_at / updated_at` | timestamps  |                                       |

Uniqueness: `(server_id, target_egg_id)`.

#### `egg_switch_logs`

Audit trail. One row per attempted switch (including failures).

| column             | type                                   | notes                                                                   |
|--------------------|----------------------------------------|-------------------------------------------------------------------------|
| `id`               | `bigint unsigned`                      | PK                                                                      |
| `server_id`        | `int unsigned`                         | FK → `servers.id`                                                       |
| `actor_user_id`    | `int unsigned`                         | FK → `users.id`                                                         |
| `source_egg_id`    | `int unsigned`                         | denormalized, survives egg deletion                                     |
| `target_egg_id`    | `int unsigned`                         | denormalized                                                            |
| `preserved_files`  | `boolean`                              | resolved at switch time from rule/override                              |
| `status`           | `enum('queued','running','success','failed')` |                                                                   |
| `error`            | `text` nullable                        | Wings error or pre-flight failure message                               |
| `started_at`       | `timestamp` nullable                   |                                                                         |
| `completed_at`     | `timestamp` nullable                   |                                                                         |
| `created_at`       | `timestamp`                            | request time                                                            |

Index: `(server_id, created_at DESC)` for "recent switches on this server."

### 2.2 Existing tables touched

No schema changes, but we read from `eggs`, `servers`, `egg_variables`, and write to `servers.egg_id` + `servers.image` + `server_variables`.

---

## 3. Backend (Laravel — app/)

### 3.1 Service layer

`App\Services\Eggs\EggSwitcherService` — the one place that knows how to switch. All write paths funnel through this. Public surface:

```php
class EggSwitcherService
{
    public function listAllowedTargets(Server $server, User $actor): Collection<EggSwitchOption>;

    public function preview(Server $server, Egg $targetEgg, User $actor): EggSwitchPreview;

    public function request(Server $server, Egg $targetEgg, User $actor, bool $keepFiles): EggSwitchLog;
}
```

- `listAllowedTargets` — resolves rule + overrides + Can-use-this-egg permission. Returns eggs with UI metadata (name, description, icon URL, preserves_files flag, warning).
- `preview` — does a dry-run resolution: which variables will change, will files be wiped, what's the cooldown state, what's the current running status. Surfaced in the confirm modal.
- `request` — the actual switch. Creates the `egg_switch_logs` row as `queued`, updates `servers.egg_id`, updates `servers.image`, rewrites `server_variables` to match the target egg's variable schema (carrying over values where variable env-keys match), dispatches `ReinstallServerJob` with `$useTargetEggInstallScript = true`, returns the log row for progress tracking.

### 3.2 Jobs

Reuse Pterodactyl's existing `DaemonServerRepository::reinstall()` call. After the DB mutation, Wings re-pulls the Docker image (which is the new `servers.image`) and re-runs the new egg's install script. The Wings-side flow doesn't change — all our new logic is Panel-side.

One wrinkle: the reinstall endpoint currently calls Wings's `/reinstall` path, which fetches the *current* egg config from the Panel's server-config endpoint. Because we mutate `egg_id` before dispatching, Wings naturally picks up the new egg. Tested path on upstream Pterodactyl; no daemon change needed.

Wings progress events flow back over the existing WebSocket install-progress channel. We listen to `InstallListener` (already wired into `ServerRouter`) and update the `egg_switch_logs.status` via an event subscriber on `ServerInstalled` / `ServerInstallFailed`.

### 3.3 Policies

`EggSwitchPolicy::switch(User, Server)` — returns true when:

- User has `control.egg-switch` permission on the server (new permission, add to `Pterodactyl\Models\Permission::$permissions`).
- Server is not installing, transferring, or under-maintenance.
- Cooldown has elapsed since the last successful switch.

Admin-level bypass: rootAdmin can switch regardless of rule; cooldown still enforced to protect the daemon.

### 3.4 API routes

Mount under `routes/api-client.php`:

```
GET    /api/client/servers/{server}/egg-switch/options        → listAllowedTargets
POST   /api/client/servers/{server}/egg-switch/preview        → preview (body: {target_egg_id})
POST   /api/client/servers/{server}/egg-switch                → request (body: {target_egg_id, keep_files?})
GET    /api/client/servers/{server}/egg-switch/status/{log}   → poll log row (WS event is primary; this is the fallback)
```

Admin routes under `routes/api-application.php`:

```
GET    /api/application/egg-switch/rules                      → index
POST   /api/application/egg-switch/rules                      → create
PATCH  /api/application/egg-switch/rules/{rule}               → update
DELETE /api/application/egg-switch/rules/{rule}               → delete

GET    /api/application/servers/{server}/egg-switch/overrides → index
POST   /api/application/servers/{server}/egg-switch/overrides → create / upsert
DELETE /api/application/servers/{server}/egg-switch/overrides/{id}
```

All routes go through Laravel's rate limiter — 10 req/min for client routes, generous for admin.

### 3.5 Admin Blade UI

Two new admin surfaces:

1. **Global rules** (`admin/egg-switch/rules`) — table + add-rule modal. Source egg → target egg → preserves_files → cooldown → warning text. Mirrors the existing `admin/nests` table styling.
2. **Per-server overrides** — a tab within the existing `admin/servers/view/{server}` Blade view. Lists current overrides, lets the admin grant or deny a specific target egg for this server.

We do NOT rewrite these in React. Admin stays on AdminLTE/Blade per the project scope.

---

## 4. Frontend (React)

### 4.1 New route

Add to `resources/scripts/routers/routes.ts`, under the `config` group:

```ts
{
    path: '/game',
    permission: 'control.egg-switch',
    name: 'Game',
    icon: faGamepad,
    group: 'config',
    component: EggSwitcherContainer,
}
```

### 4.2 Components

All under `resources/scripts/components/server/egg-switch/`:

- `EggSwitcherContainer.tsx` — page shell, fetches `GET /egg-switch/options`, renders grid.
- `EggCard.tsx` — glassy panel per option, default flat, hover lifts + purple glow. Shows icon, name, short description, badges for `preserves_files=false` (pink "wipes files" badge).
- `ConfirmDialog.tsx` — two-step confirm. Step 1 shows the preview (variable diff, file-wipe warning, cooldown). Step 2 requires typing the server's name. Pink `.gynx-btn-destructive` "Switch and wipe" / purple `.gynx-btn-primary` "Switch".
- `ProgressPanel.tsx` — subscribes to the install WebSocket events; shows "Pulling image → Running install script → Finishing". Uses the `.gynx-progress` primitive.

### 4.3 API client

`resources/scripts/api/server/eggSwitch/`:

- `listOptions.ts` — `GET /egg-switch/options` → `EggSwitchOption[]`.
- `previewSwitch.ts` — `POST /egg-switch/preview`.
- `requestSwitch.ts` — `POST /egg-switch`.

Shape of `EggSwitchOption`:

```ts
export interface EggSwitchOption {
    eggId: number;
    name: string;
    description: string;
    iconUrl: string | null;
    preservesFiles: boolean;
    cooldownRemainingSeconds: number;
    warningCopy: string | null;
}
```

### 4.4 State

Keep it local. No easy-peasy store slice — the switcher is a one-page feature and progress is driven by the existing `InstallListener` WebSocket events already in `ServerContext`.

### 4.5 UX rules (from the design spec)

- Default card state: flat `#1F2937`, neutral edge. **No glow at rest.**
- Hover: -2 lift + purple glow + slight scale on the icon.
- `preserves_files=false` cards show a pink badge *on hover only* so the page isn't noisy.
- Destructive confirm button is **pink**, never red — red is error-state text only.
- Progress: replace the card grid with a single centered panel showing the live step.
- After success: auto-redirect back to Console with a green flash banner.

---

## 5. Permissions

Add two new permission keys under `server` scope in `Pterodactyl\Models\Permission`:

- `control.egg-switch` — user can initiate a switch on this server.
- `admin.egg-switch` — admin-only; lets a rootAdmin bypass rules for support cases.

Default subuser role grants `control.egg-switch` = false (opt-in).

---

## 6. Audit, rate limits, safety

- **Audit**: every `request` attempt creates an `egg_switch_logs` row, before any mutation. If pre-flight fails (conflict state, cooldown, policy deny), the row is written with `status=failed` and an error message so there's still a record.
- **Rate limits**: Laravel throttle `10/min` on the client route, plus the per-rule `cooldown_minutes` guarding back-to-back switches on the same server.
- **Safety**: switching while the server is running forces a stop first (just like existing reinstall). Switching is blocked while a backup is in-progress; we read the server's `SERVER_ACTIVITY` events to detect that state.
- **Reversibility**: there is none at the file-system level if `preserves_files=false`. Users see this clearly in the confirm dialog, and the admin rule copy can emphasize it. No undo button by design.

---

## 7. API design — end-to-end example

### Client flow

```http
GET /api/client/servers/abc123/egg-switch/options
200 OK
[
  {
    "eggId": 12,
    "name": "Minecraft — Paper",
    "description": "Optimized PaperMC server. Compatible with most Bukkit/Spigot plugins.",
    "iconUrl": "https://cdn.gynx.gg/eggs/paper.png",
    "preservesFiles": true,
    "cooldownRemainingSeconds": 0,
    "warningCopy": null
  },
  {
    "eggId": 17,
    "name": "Valheim (Dedicated)",
    "description": "Vanilla Valheim dedicated server. Wipes current world directory on switch.",
    "iconUrl": "https://cdn.gynx.gg/eggs/valheim.png",
    "preservesFiles": false,
    "cooldownRemainingSeconds": 0,
    "warningCopy": "Switching to Valheim will remove Minecraft files. Back up first if you want to return."
  }
]

POST /api/client/servers/abc123/egg-switch/preview
{ "target_egg_id": 17 }
200 OK
{
  "targetEgg": { "eggId": 17, "name": "Valheim (Dedicated)", "dockerImage": "ghcr.io/pterodactyl/yolks:debian" },
  "variableChanges": [
    { "envKey": "SERVER_NAME",      "from": "Survival World", "to": "<default: My Server>" },
    { "envKey": "SERVER_PASSWORD",  "from": null,             "to": "<default: changeme>" }
  ],
  "filesWipeRequired": true,
  "cooldownRemainingSeconds": 0,
  "warnings": [
    "Switching wipes /home/container. Create a backup if you want to restore later."
  ]
}

POST /api/client/servers/abc123/egg-switch
{ "target_egg_id": 17, "keep_files": false }
202 Accepted
{
  "logId": 884,
  "status": "queued",
  "trackUrl": "/api/client/servers/abc123/egg-switch/status/884"
}
```

Progress thereafter comes via the existing WebSocket: `install started`, `install output` lines, `install completed` / `install failed`. The UI listens to those and updates `ProgressPanel`.

---

## 8. Installer + integration approach

This feature touches the Panel's backend. We can't ship it through the `install-bundle.sh` deploy (which only replaces `public/assets/`). Options:

### Option A — merge the backend code into the fork

Commit the `app/`, `database/migrations/`, `routes/`, `resources/views/admin/egg-switch/` code into `gynxnick/gynx-panel`. Deploy by pulling the fork on the panel host and running `php artisan migrate`. This requires gynx-panel to own the full Pterodactyl deployment (not just the React bundle), which is a bigger ops lift.

### Option B — ship as a standalone "module"

Keep backend code in a separate `gynx-egg-switcher` package installed via `composer require gynx/egg-switcher`. Pterodactyl has a rough module loader via Laravel's service provider auto-discovery. Pro: upstream-merge-safe, the fork stays lean. Con: we have to build and maintain a packaged service provider, and Pterodactyl has no formal plugin API so loader shims are hacky.

### Option C — full-stack fork (recommended)

Just own the whole thing. gynx-panel already IS the fork; the React work assumes we deploy the built Panel, not just its assets. The install-bundle.sh script becomes one of two install modes:

- `install-bundle.sh` — assets-only (existing).
- `install-full.sh` — migrations + service providers + React + blade templates + asset build. For deployments that want the backend features, including Egg Switcher.

**Option C is recommended** because Egg Switcher is never going to be a "drop in" feature — it needs migrations and routes and policies, so the deployment model must own the backend regardless. The existing `install-bundle.sh` stays useful for panels that only want the React skin without the new features.

---

## 9. Build phases (proposed PR sequence)

Each phase is one self-contained PR against `gynx-panel:main`. Order matters — later phases depend on earlier ones.

1. **Migrations + models** (backend, no UI yet). Three migrations, three Eloquent models, unit tests on the relationship graph. Deployable but invisible.
2. **Service layer + policies + permission key**. Implements `EggSwitcherService`, `EggSwitchPolicy`, adds `control.egg-switch` to the permission map. Still no UI.
3. **Client API endpoints** (§3.4 first four). Unit + feature tests. Reachable via curl.
4. **React feature**: container + EggCard grid + ConfirmDialog + ProgressPanel. Ships behind a feature flag (env var `GYNX_EGG_SWITCHER=1`) so we can test on staging without exposing to prod users.
5. **Admin Blade UI** for rules + per-server overrides (§3.5). Rootadmin-only.
6. **Audit log surfacing** — add a read endpoint + a small "history" drawer on the Game page listing this server's past switches.
7. **install-full.sh** deploy script (§8 option C). Documents the backend install path.
8. **Remove feature flag**, ship to prod.

Rough time budget: phases 1-3 are ~1 session each with tests. Phase 4 is 1-2 sessions (UI polish). Phases 5-8 are ~1 session each. So ~8-10 focused sessions for the whole thing.

---

## 10. Open questions

- **Backup integration**: should we offer "take a backup first" as a checkbox on the confirm dialog? Pro: real safety net. Con: adds a second async job to the flow. *Recommendation: ship without it; add in a later phase if support load justifies.*
- **Egg iconography**: admin uploads vs. a default icon pack? *Recommendation: start with admin uploads to a static path, add a small default set later.*
- **Cross-node servers**: if a user's server is on Node A and the target egg's Docker image isn't pre-pulled on Node A, first install will be slow. Fine; Wings will pull on-demand.
- **Billing integration**: out of scope for this doc. If eggs have price tiers, that's a billing-layer concern handled upstream of the switch API (e.g. reject the request with 402 before it hits the switcher).

---

## 11. What this doc is NOT

- A commitment to build. It's the reference we'll build *against* in follow-up sessions.
- A substitute for reading Pterodactyl's existing reinstall code. Before phase 1, spend 30 minutes in `app/Services/Servers/*` and `app/Jobs/*` to confirm the current reinstall path still looks the way I'm describing it on v1.11.11.

---

gynx.gg — host smarter. play harder.
