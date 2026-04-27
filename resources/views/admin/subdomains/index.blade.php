@extends('layouts.admin')

@section('title')
    Subdomains
@endsection

@section('content-header')
    <h1>Subdomains<small>Cloudflare-managed parent zones the panel can issue subdomains under.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Subdomains</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="alert alert-info" style="margin-bottom: 16px;">
                <strong><i class="fa fa-info-circle"></i> How this works.</strong>
                Add the parent domains you've set up in Cloudflare here (e.g. <code>play.gynx.gg</code>).
                Users on the panel can then claim a hostname like <code>myserver.play.gynx.gg</code> from their server's
                Domain tab; the panel creates the matching DNS record(s) under the zone via the Cloudflare API.
                Token must have <code>Zone:DNS:Edit</code> for the chosen zone.
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Add a zone</h3>
                </div>
                <div class="box-body">
                    <form action="{{ route('admin.subdomains.store') }}" method="POST">
                        {{ csrf_field() }}
                        <div class="row">
                            <div class="col-md-3 form-group">
                                <label>Label</label>
                                <input type="text" name="label" class="form-control" maxlength="100"
                                       placeholder="Play" required>
                                <p class="text-muted small">Human-friendly name shown to users.</p>
                            </div>
                            <div class="col-md-3 form-group">
                                <label>Domain</label>
                                <input type="text" name="domain" class="form-control" maxlength="253"
                                       placeholder="play.gynx.gg" required>
                                <p class="text-muted small">Exact zone hostname configured in Cloudflare.</p>
                            </div>
                            <div class="col-md-3 form-group">
                                <label>Cloudflare zone ID</label>
                                <input type="text" name="provider_zone_id" class="form-control" maxlength="64"
                                       placeholder="32-char hex from CF dashboard" required>
                                <p class="text-muted small">Cloudflare → zone overview → API section.</p>
                            </div>
                            <div class="col-md-3 form-group">
                                <label>API token</label>
                                <input type="password" name="provider_token" class="form-control"
                                       autocomplete="new-password" maxlength="512"
                                       placeholder="scoped token: Zone:DNS:Edit" required>
                                <p class="text-muted small">Scoped, not Global. Validated on save.</p>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-sm">Add zone</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Registered zones</h3>
                </div>
                <div class="box-body table-responsive no-padding">
                    <table class="table table-hover">
                        <tr>
                            <th>Label</th>
                            <th>Domain</th>
                            <th>Provider</th>
                            <th>Active records</th>
                            <th>Status</th>
                            <th></th>
                            <th></th>
                        </tr>
                        @forelse($zones as $zone)
                            <tr>
                                <td><strong>{{ $zone->label }}</strong></td>
                                <td><code>{{ $zone->domain }}</code></td>
                                <td>
                                    <span class="label label-info">{{ $zone->provider }}</span>
                                </td>
                                <td>{{ $zone->records_count }}</td>
                                <td>
                                    @if($zone->enabled)
                                        <span class="label label-success">enabled</span>
                                    @else
                                        <span class="label label-default">disabled</span>
                                    @endif
                                </td>
                                <td>
                                    <form action="{{ route('admin.subdomains.toggle', $zone) }}" method="POST" style="display:inline">
                                        {{ csrf_field() }}
                                        <button type="submit" class="btn btn-xs btn-default">
                                            {{ $zone->enabled ? 'Disable' : 'Enable' }}
                                        </button>
                                    </form>
                                </td>
                                <td>
                                    <form action="{{ route('admin.subdomains.destroy', $zone) }}" method="POST" style="display:inline"
                                          onsubmit="return confirm('Remove this zone? Only allowed when no active records.')">
                                        {{ csrf_field() }}
                                        {{ method_field('DELETE') }}
                                        <button type="submit" class="btn btn-xs btn-danger" {{ $zone->records_count > 0 ? 'disabled' : '' }}>
                                            <i class="fa fa-trash-o"></i>
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="7" class="text-center text-muted" style="padding: 24px;">
                                    No zones yet. Add one above to let users claim subdomains.
                                </td>
                            </tr>
                        @endforelse
                    </table>
                </div>
            </div>
        </div>
    </div>
@endsection
