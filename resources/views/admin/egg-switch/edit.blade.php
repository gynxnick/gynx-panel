@extends('layouts.admin')

@section('title')
    Edit rule — Egg Switch
@endsection

@section('content-header')
    <h1>Edit rule #{{ $rule->id }}<small>Update egg-switch policy + imagery.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.egg-switch.index') }}">Egg Switch</a></li>
        <li class="active">Edit #{{ $rule->id }}</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Rule #{{ $rule->id }}</h3>
                </div>
                <div class="box-body">
                    <form action="{{ route('admin.egg-switch.update', $rule) }}" method="POST">
                        {{ csrf_field() }}
                        {{ method_field('PATCH') }}
                        <div class="row">
                            <div class="col-md-4 form-group">
                                <label>Source egg</label>
                                <select name="source_egg_id" class="form-control">
                                    <option value="" @if($rule->source_egg_id === null) selected @endif>(any egg — global rule)</option>
                                    @foreach($eggs as $egg)
                                        <option value="{{ $egg->id }}" @if((int) $rule->source_egg_id === (int) $egg->id) selected @endif>
                                            {{ $egg->nest?->name ?? '?' }} / {{ $egg->name }}
                                        </option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-md-4 form-group">
                                <label>Target egg <span class="text-danger">*</span></label>
                                <select name="target_egg_id" class="form-control" required>
                                    @foreach($eggs as $egg)
                                        <option value="{{ $egg->id }}" @if((int) $rule->target_egg_id === (int) $egg->id) selected @endif>
                                            {{ $egg->nest?->name ?? '?' }} / {{ $egg->name }}
                                        </option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-md-2 form-group">
                                <label>Cooldown (minutes)</label>
                                <input type="number" name="cooldown_minutes" class="form-control"
                                       value="{{ (int) $rule->cooldown_minutes }}" min="0" max="10080">
                            </div>
                            <div class="col-md-2 form-group">
                                <label>Preserves files?</label>
                                <select name="preserves_files" class="form-control">
                                    <option value="0" @if(!$rule->preserves_files) selected @endif>No — wipes</option>
                                    <option value="1" @if($rule->preserves_files) selected @endif>Yes — keeps</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12 form-group">
                                <label>Warning copy</label>
                                <input type="text" name="warning_copy" class="form-control" maxlength="500"
                                       value="{{ $rule->warning_copy }}"
                                       placeholder="e.g. Switching to Valheim wipes your Minecraft world.">
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12 form-group">
                                <label>Quick-fill from Modrinth</label>
                                <div class="input-group">
                                    <input type="text" class="form-control modrinth-slug-input"
                                           placeholder="modrinth project slug — e.g. paper, fabric-loader, sodium, atm10">
                                    <span class="input-group-btn">
                                        <button type="button" class="btn btn-default modrinth-fetch-btn">Fetch icon &amp; banner</button>
                                    </span>
                                </div>
                                <p class="text-muted small modrinth-status">Fills in both URL fields below from <code>api.modrinth.com</code>. Slug is whatever's after <code>modrinth.com/{type}/</code>.</p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 form-group">
                                <label>Icon URL</label>
                                <input type="url" name="icon_url" class="form-control" maxlength="2048"
                                       value="{{ $rule->icon_url }}"
                                       placeholder="https://cdn.example.com/games/minecraft.png">
                                <p class="text-muted small">Small square icon, ~40&times;40. PNG / JPG / SVG / WebP.</p>
                                @if($rule->icon_url)
                                    <div style="margin-top: 6px;">
                                        <img src="{{ $rule->icon_url }}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:6px;">
                                    </div>
                                @endif
                            </div>
                            <div class="col-md-6 form-group">
                                <label>Banner URL</label>
                                <input type="url" name="banner_url" class="form-control" maxlength="2048"
                                       value="{{ $rule->banner_url }}"
                                       placeholder="https://cdn.example.com/games/minecraft-banner.jpg">
                                <p class="text-muted small">Wide banner shown at the top of the card. ~3:1 aspect recommended.</p>
                                @if($rule->banner_url)
                                    <div style="margin-top: 6px;">
                                        <img src="{{ $rule->banner_url }}" alt="" style="width:100%;max-width:360px;height:80px;object-fit:cover;border-radius:6px;">
                                    </div>
                                @endif
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-sm">Save changes</button>
                        <a href="{{ route('admin.egg-switch.index') }}" class="btn btn-default btn-sm">Cancel</a>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        // Modrinth quick-fill — same behaviour as the index page (CORS-friendly
        // public API, scoped per form so multiple instances would coexist).
        document.addEventListener('DOMContentLoaded', function () {
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
