@extends('layouts.admin')

@section('title')
    Egg Switch Rules
@endsection

@section('content-header')
    <h1>Egg Switch Rules<small>Control which egg transitions customers can perform from the Game page.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Egg Switch</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Client page intro copy</h3>
                </div>
                <div class="box-body">
                    <form action="{{ route('admin.egg-switch.copy') }}" method="POST">
                        {{ csrf_field() }}
                        <div class="form-group">
                            <textarea name="intro_copy" class="form-control" rows="2" maxlength="1000"
                                placeholder="Shown at the top of /server/:id/game">{{ $introCopy }}</textarea>
                            <p class="text-muted small">Shown above the game grid on every server's Game page. Leave blank to restore the default.</p>
                        </div>
                        <button type="submit" class="btn btn-primary btn-sm">Save intro copy</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Add a rule</h3>
                </div>
                <div class="box-body">
                    <form action="{{ route('admin.egg-switch.store') }}" method="POST">
                        {{ csrf_field() }}
                        <div class="row">
                            <div class="col-md-4 form-group">
                                <label>Source egg</label>
                                <select name="source_egg_id" class="form-control" id="egg-switch-source">
                                    <option value="">(any egg — global rule)</option>
                                    @foreach($eggs as $egg)
                                        <option value="{{ $egg->id }}">{{ $egg->nest?->name ?? '?' }} / {{ $egg->name }}</option>
                                    @endforeach
                                </select>
                                <p class="text-muted small">If set, the rule only applies when the server is currently running this egg.</p>
                            </div>
                            <div class="col-md-4 form-group">
                                <label>Target egg <span class="text-danger">*</span></label>
                                <select name="target_egg_id" class="form-control" id="egg-switch-target" required>
                                    <option value="">— choose —</option>
                                    @foreach($eggs as $egg)
                                        <option value="{{ $egg->id }}" data-egg-label="{{ $egg->nest?->name ?? '?' }} / {{ $egg->name }}">{{ $egg->nest?->name ?? '?' }} / {{ $egg->name }}</option>
                                    @endforeach
                                </select>
                                <p class="text-muted small">The egg the server can switch <em>to</em>. Eggs with an existing rule for the chosen source are disabled.</p>
                            </div>
                            <div class="col-md-2 form-group">
                                <label>Cooldown (minutes)</label>
                                <input type="number" name="cooldown_minutes" class="form-control" value="0" min="0" max="10080">
                                <p class="text-muted small">0 = no cooldown.</p>
                            </div>
                            <div class="col-md-2 form-group">
                                <label>Preserves files?</label>
                                <select name="preserves_files" class="form-control">
                                    <option value="0">No — wipes</option>
                                    <option value="1">Yes — keeps</option>
                                </select>
                                <p class="text-muted small">Informational warning shown to users.</p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12 form-group">
                                <label>Warning copy</label>
                                <input type="text" name="warning_copy" class="form-control" maxlength="500"
                                       placeholder="e.g. Switching to Valheim wipes your Minecraft world.">
                                <p class="text-muted small">Optional. Shown in the confirm dialog.</p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 form-group">
                                <label>Quick-fill from Modrinth</label>
                                <div class="input-group">
                                    <input type="text" class="form-control modrinth-slug-input"
                                           placeholder="modrinth slug — e.g. paper, fabric-loader, sodium">
                                    <span class="input-group-btn">
                                        <button type="button" class="btn btn-default modrinth-fetch-btn">Fetch from Modrinth</button>
                                    </span>
                                </div>
                                <p class="text-muted small modrinth-status">Pulls icon + featured gallery image from <code>api.modrinth.com</code>.</p>
                            </div>
                            <div class="col-md-6 form-group">
                                <label>Quick-fill from Steam</label>
                                <div class="input-group">
                                    <input type="text" class="form-control steam-appid-input" inputmode="numeric"
                                           placeholder="steam app id — e.g. 892970 (Valheim), 252490 (Rust)">
                                    <span class="input-group-btn">
                                        <button type="button" class="btn btn-default steam-fetch-btn">Fetch from Steam</button>
                                    </span>
                                </div>
                                <p class="text-muted small steam-status">Builds Steam CDN URLs (library cover + library hero). Falls back to header.jpg for older games.</p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 form-group">
                                <label>Icon URL</label>
                                <input type="url" name="icon_url" class="form-control" maxlength="2048"
                                       placeholder="https://cdn.example.com/games/minecraft.png">
                                <p class="text-muted small">Small square icon ~40&times;40. PNG / JPG / SVG / WebP.</p>
                            </div>
                            <div class="col-md-6 form-group">
                                <label>Banner URL</label>
                                <input type="url" name="banner_url" class="form-control" maxlength="2048"
                                       placeholder="https://cdn.example.com/games/minecraft-banner.jpg">
                                <p class="text-muted small">Wide banner at the top of the card. ~3:1 aspect ratio.</p>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-sm">Add rule</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Existing rules</h3>
                </div>
                <div class="box-body table-responsive no-padding">
                    <table class="table table-hover">
                        <tr>
                            <th>Icon</th>
                            <th>Banner</th>
                            <th>Source</th>
                            <th>Target</th>
                            <th>Preserves</th>
                            <th>Cooldown</th>
                            <th>Warning</th>
                            <th>Status</th>
                            <th></th>
                            <th></th>
                            <th></th>
                        </tr>
                        @forelse($rules as $rule)
                            <tr>
                                <td style="width: 56px;">
                                    @if($rule->icon_url)
                                        <img src="{{ $rule->icon_url }}"
                                             alt=""
                                             style="width:32px;height:32px;object-fit:cover;border-radius:4px;"
                                             onerror="this.style.display='none'">
                                    @else
                                        <i class="fa fa-gamepad text-muted"></i>
                                    @endif
                                </td>
                                <td style="width: 110px;">
                                    @if($rule->banner_url)
                                        <img src="{{ $rule->banner_url }}"
                                             alt=""
                                             style="width:100px;height:34px;object-fit:cover;border-radius:4px;"
                                             onerror="this.style.display='none'">
                                    @else
                                        <span class="text-muted">—</span>
                                    @endif
                                </td>
                                <td>
                                    @if($rule->sourceEgg)
                                        <code>#{{ $rule->source_egg_id }}</code> {{ $rule->sourceEgg->name }}
                                    @else
                                        <em class="text-muted">any egg</em>
                                    @endif
                                </td>
                                <td>
                                    <code>#{{ $rule->target_egg_id }}</code> {{ $rule->targetEgg?->name ?? '(deleted)' }}
                                </td>
                                <td>{!! $rule->preserves_files
                                    ? '<span class="label label-success">yes</span>'
                                    : '<span class="label label-warning">no — wipes</span>' !!}</td>
                                <td>
                                    @if($rule->cooldown_minutes > 0)
                                        {{ $rule->cooldown_minutes }}m
                                    @else
                                        <em class="text-muted">none</em>
                                    @endif
                                </td>
                                <td style="max-width: 300px;">
                                    <small>{{ $rule->warning_copy ?: '—' }}</small>
                                </td>
                                <td>{!! $rule->enabled
                                    ? '<span class="label label-success">enabled</span>'
                                    : '<span class="label label-default">disabled</span>' !!}</td>
                                <td>
                                    <form action="{{ route('admin.egg-switch.toggle', $rule) }}" method="POST" style="display:inline">
                                        {{ csrf_field() }}
                                        <button type="submit" class="btn btn-xs btn-default">
                                            {{ $rule->enabled ? 'Disable' : 'Enable' }}
                                        </button>
                                    </form>
                                </td>
                                <td>
                                    <a href="{{ route('admin.egg-switch.edit', $rule) }}" class="btn btn-xs btn-primary">
                                        <i class="fa fa-pencil"></i>
                                    </a>
                                </td>
                                <td>
                                    <form action="{{ route('admin.egg-switch.destroy', $rule) }}" method="POST" style="display:inline"
                                          onsubmit="return confirm('Delete this rule?')">
                                        {{ csrf_field() }}
                                        {{ method_field('DELETE') }}
                                        <button type="submit" class="btn btn-xs btn-danger">
                                            <i class="fa fa-trash-o"></i>
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="11" class="text-center text-muted" style="padding: 24px;">
                                    No rules yet. Add one above to let customers switch games.
                                </td>
                            </tr>
                        @endforelse
                    </table>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        // Map of source egg id ('0' = "any egg / global") → [taken target ids].
        const takenTargets = @json($takenTargets ?? new stdClass);

        function refreshTargetOptions() {
            const sourceSel = document.getElementById('egg-switch-source');
            const targetSel = document.getElementById('egg-switch-target');
            if (!sourceSel || !targetSel) return;

            const sourceKey = sourceSel.value === '' ? '0' : sourceSel.value;
            const blocked = new Set((takenTargets[sourceKey] || []).map(String));

            Array.from(targetSel.options).forEach((opt) => {
                if (!opt.value) return; // placeholder
                const label = opt.dataset.eggLabel || opt.textContent;
                if (blocked.has(opt.value)) {
                    opt.disabled = true;
                    opt.textContent = label + '  — rule exists';
                    if (targetSel.value === opt.value) targetSel.value = '';
                } else {
                    opt.disabled = false;
                    opt.textContent = label;
                }
            });
        }

        document.addEventListener('DOMContentLoaded', function () {
            const sourceSel = document.getElementById('egg-switch-source');
            if (sourceSel) {
                sourceSel.addEventListener('change', refreshTargetOptions);
                refreshTargetOptions();
            }

            // ---- Steam quick-fill -----------------------------------------
            // Steam's store API blocks browser fetch (no CORS), but their
            // CDN serves images to any origin. We can probe asset existence
            // via Image.onload/onerror — works even when fetch wouldn't.
            // Tries the modern library art first, falls back to the older
            // store header for games published before Steam introduced it.
            const STEAM_CDN = 'https://cdn.cloudflare.steamstatic.com/steam/apps';
            const STEAM_LIBRARY_CDN = 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps';

            function probeImage(url) {
                return new Promise(function (resolve) {
                    const img = new Image();
                    img.onload = function () { resolve(true); };
                    img.onerror = function () { resolve(false); };
                    img.src = url;
                });
            }

            async function pickFirstAvailable(urls) {
                for (const u of urls) {
                    if (await probeImage(u)) return u;
                }
                return null;
            }

            document.querySelectorAll('.steam-fetch-btn').forEach(function (btn) {
                btn.addEventListener('click', async function () {
                    const form = btn.closest('form');
                    if (!form) return;
                    const appInput = form.querySelector('.steam-appid-input');
                    const status = form.querySelector('.steam-status');
                    const iconInput = form.querySelector('input[name="icon_url"]');
                    const bannerInput = form.querySelector('input[name="banner_url"]');
                    const appid = (appInput.value || '').trim();
                    if (!appid || !/^\d+$/.test(appid)) {
                        status.innerHTML = '<span style="color:#dd4b39">Enter a numeric Steam app ID (the number in any store.steampowered.com/app/&lt;id&gt; URL).</span>';
                        return;
                    }
                    status.innerHTML = '<span class="text-muted">Probing Steam CDN…</span>';
                    btn.disabled = true;
                    try {
                        const iconUrl = await pickFirstAvailable([
                            STEAM_LIBRARY_CDN + '/' + appid + '/library_600x900.jpg',
                            STEAM_CDN + '/' + appid + '/header.jpg',
                        ]);
                        const bannerUrl = await pickFirstAvailable([
                            STEAM_LIBRARY_CDN + '/' + appid + '/library_hero.jpg',
                            STEAM_CDN + '/' + appid + '/page_bg_generated_v6b.jpg',
                            STEAM_CDN + '/' + appid + '/header.jpg',
                        ]);
                        if (!iconUrl && !bannerUrl) {
                            status.innerHTML = '<span style="color:#dd4b39">No assets found for app ' + appid + '. Double-check the app ID.</span>';
                            return;
                        }
                        if (iconUrl) iconInput.value = iconUrl;
                        if (bannerUrl) bannerInput.value = bannerUrl;
                        const parts = ['Loaded Steam app ' + appid + '.'];
                        if (!iconUrl) parts.push('No icon — paste one manually.');
                        if (!bannerUrl) parts.push('No banner — paste one manually.');
                        status.innerHTML = '<span style="color:#5cb85c">' + parts.join(' ') + ' Save to apply.</span>';
                    } catch (e) {
                        status.innerHTML = '<span style="color:#dd4b39">Probe error: ' + (e.message || e) + '</span>';
                    } finally {
                        btn.disabled = false;
                    }
                });
            });

            // ---- Modrinth quick-fill --------------------------------------
            // Scoped per form so multiple instances work. Hits api.modrinth.com
            // directly (CORS allowed on read endpoints) and writes the
            // icon_url + banner_url inputs in the same form.
            document.querySelectorAll('.modrinth-fetch-btn').forEach(function (btn) {
                btn.addEventListener('click', async function () {
                    const form = btn.closest('form');
                    if (!form) return;
                    const slugInput = form.querySelector('.modrinth-slug-input');
                    const status = form.querySelector('.modrinth-status');
                    const iconInput = form.querySelector('input[name="icon_url"]');
                    const bannerInput = form.querySelector('input[name="banner_url"]');
                    const slug = (slugInput.value || '').trim().toLowerCase();
                    if (!slug) {
                        status.innerHTML = '<span style="color:#dd4b39">Enter a Modrinth slug first.</span>';
                        return;
                    }
                    status.innerHTML = '<span class="text-muted">Fetching from Modrinth…</span>';
                    btn.disabled = true;
                    try {
                        const res = await fetch('https://api.modrinth.com/v2/project/' + encodeURIComponent(slug), {
                            headers: { 'Accept': 'application/json' },
                        });
                        if (res.status === 404) {
                            status.innerHTML = '<span style="color:#dd4b39">No Modrinth project named &quot;' + slug + '&quot;.</span>';
                            return;
                        }
                        if (!res.ok) {
                            status.innerHTML = '<span style="color:#dd4b39">Modrinth returned HTTP ' + res.status + '.</span>';
                            return;
                        }
                        const data = await res.json();
                        if (data.icon_url) {
                            iconInput.value = data.icon_url;
                        }
                        const gallery = Array.isArray(data.gallery) ? data.gallery : [];
                        // Prefer the featured gallery image, else the first one.
                        const banner = gallery.find(function (g) { return g.featured; }) || gallery[0];
                        if (banner && banner.url) {
                            bannerInput.value = banner.url;
                        }
                        const parts = ['Loaded ' + (data.title || slug) + '.'];
                        if (!data.icon_url) parts.push('No icon on Modrinth.');
                        if (!banner) parts.push('No gallery image — set the banner manually.');
                        status.innerHTML = '<span style="color:#5cb85c">' + parts.join(' ') + ' Save to apply.</span>';
                    } catch (e) {
                        status.innerHTML = '<span style="color:#dd4b39">Network error: ' + (e.message || e) + '</span>';
                    } finally {
                        btn.disabled = false;
                    }
                });
            });
        });
    </script>
@endsection
