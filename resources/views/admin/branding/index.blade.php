@extends('layouts.admin')

@section('title')
    Branding
@endsection

@section('content-header')
    <h1>Branding<small>Editable panel text, taglines, and the logo.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Branding</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="alert alert-info" style="margin-bottom: 16px;">
                <strong><i class="fa fa-info-circle"></i> Heads up — most edits here are live, but two things require a rebuild.</strong>
                <ul style="margin: 6px 0 0 18px; padding: 0;">
                    <li>
                        Saved values become live for new page loads as soon as you hit <em>Save branding</em>. Logged-in users
                        may need a hard refresh (<kbd>Ctrl+Shift+R</kbd>) to clear the bundled <code>SiteConfiguration</code>.
                    </li>
                    <li>
                        If you change a <strong>default</strong> value (i.e. you edit the source code, not the form), or add a
                        new field, the panel must be rebuilt: <code>yarn build:production</code> on the server.
                    </li>
                </ul>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Panel text + logo</h3>
                    <div class="box-tools">
                        <form action="{{ route('admin.branding.reset') }}" method="POST" style="display:inline"
                              onsubmit="return confirm('Restore every field to its default?')">
                            {{ csrf_field() }}
                            <button type="submit" class="btn btn-xs btn-default">Reset all to defaults</button>
                        </form>
                    </div>
                </div>
                <div class="box-body">
                    <p class="text-muted">
                        These values are served from the <code>settings::gynx:*</code> namespace and rendered by the
                        React bundle. Changes take effect immediately for new page loads. Leave a field blank to restore
                        its default.
                    </p>

                    <form action="{{ route('admin.branding.update') }}" method="POST">
                        {{ csrf_field() }}

                        @foreach($fields as $key => $meta)
                            <div class="form-group">
                                <label>{{ $meta['label'] }}</label>
                                @if($key === 'auth_lede' || $key === 'dashboard_empty_body' || $key === 'modpack_install_warning')
                                    <textarea name="{{ $key }}" class="form-control"
                                        rows="{{ $key === 'modpack_install_warning' ? 4 : 2 }}"
                                        maxlength="{{ $meta['max'] }}"
                                        placeholder="{{ $meta['default'] }}">{{ $values[$key] }}</textarea>
                                @elseif($key === 'logo_url')
                                    <input type="url" name="{{ $key }}" class="form-control" maxlength="{{ $meta['max'] }}"
                                        placeholder="https://cdn.gynx.gg/logo.png" value="{{ $values[$key] }}">
                                    @if($values[$key])
                                        <div style="margin-top: 8px;">
                                            <img src="{{ $values[$key] }}" alt="" style="height:40px;border-radius:8px;">
                                        </div>
                                    @else
                                        <p class="text-muted small">Leave blank to use the bundled gynx.gg mark.</p>
                                    @endif
                                @else
                                    <input type="text" name="{{ $key }}" class="form-control" maxlength="{{ $meta['max'] }}"
                                        placeholder="{{ $meta['default'] }}" value="{{ $values[$key] }}">
                                @endif
                                @if($key !== 'logo_url')
                                    <p class="text-muted small"><em>Default:</em> {{ $meta['default'] ?: '(empty)' }}</p>
                                @endif
                            </div>
                        @endforeach

                        <button type="submit" class="btn btn-primary btn-sm">Save branding</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
