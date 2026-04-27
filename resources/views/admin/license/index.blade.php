@extends('layouts.gynx-admin')

@section('title', 'License')
@section('header-title', 'License')
@section('header-sub', "This panel's gynx.gg license key.")

@section('content')
    @php
        $statusLabel = match($status['status']) {
            'valid'       => ['cls' => 'success', 'text' => 'Valid'],
            'invalid'     => ['cls' => 'danger',  'text' => 'Invalid'],
            'unreachable' => ['cls' => 'warning', 'text' => 'Unreachable'],
            default       => ['cls' => 'info',    'text' => 'Unlicensed'],
        };
    @endphp

    @if($status['status'] === 'valid')
        <div class="alert alert--success">
            <strong>License accepted.</strong>
            {{ $status['message'] ?: 'OK' }}.
            @if($status['plan']) Plan: <strong>{{ $status['plan'] }}</strong>. @endif
            @if($status['max_servers']) Bound {{ $status['bound_count'] }}/{{ $status['max_servers'] }} instances. @endif
        </div>
    @elseif($status['status'] === 'invalid')
        <div class="alert alert--danger">
            <strong>License rejected.</strong>
            {{ $status['message'] ?: 'Invalid license.' }}
        </div>
    @elseif($status['status'] === 'unreachable')
        <div class="alert alert--warning">
            <strong>Could not reach the license server.</strong>
            {{ $status['message'] ?: '' }} Last successful check:
            {{ $status['last_check'] ? \Carbon\Carbon::parse($status['last_check'])->diffForHumans() : 'never' }}.
        </div>
    @else
        <div class="alert alert--info">
            <strong>No license key set.</strong>
            Paste your gynx-panel license key below to activate the panel.
        </div>
    @endif

    <div class="grid grid--main-side">
        <div class="card">
            <div class="card__header">
                <h3 class="card__title">License key</h3>
                <span class="pill pill--{{ $statusLabel['cls'] }}">
                    <span class="pill__dot"></span>{{ $statusLabel['text'] }}
                </span>
            </div>
            <div class="card__body">
                <form action="{{ route('admin.license.update') }}" method="POST">
                    {{ csrf_field() }}
                    <div class="field">
                        <label class="field__label" for="f-key">Key</label>
                        @if($key)
                            <code class="code-display">{{ $key }}</code>
                            <input id="f-key" type="text" name="key" class="field__input"
                                   placeholder="Paste a different key to replace…">
                        @else
                            <input id="f-key" type="text" name="key" class="field__input"
                                   placeholder="GYNX-XXXX-XXXX-XXXX-…" required autofocus>
                        @endif
                        <span class="field__hint">
                            Issue a key at <a href="https://gynx.gg/admin/licenses" target="_blank" rel="noopener">gynx.gg → Admin → Licenses</a>
                            (pick the <em>gynx panel</em> product). Validates against <code>{{ $apiUrl }}</code>.
                        </span>
                    </div>
                    <button type="submit" class="btn btn--primary">
                        {{ $key ? 'Update' : 'Save' }} key
                    </button>
                </form>

                @if($key)
                    <hr class="divider">
                    <div class="btn-row">
                        <form action="{{ route('admin.license.verify') }}" method="POST" style="display:inline">
                            {{ csrf_field() }}
                            <button type="submit" class="btn btn--ghost btn--sm">
                                <i class="fa fa-refresh"></i> Re-verify now
                            </button>
                        </form>
                        <form action="{{ route('admin.license.destroy') }}" method="POST" style="display:inline"
                              onsubmit="return confirm('Clear the license key? Licensed features will lock down on next page load.')">
                            {{ csrf_field() }}
                            {{ method_field('DELETE') }}
                            <button type="submit" class="btn btn--danger btn--sm">
                                <i class="fa fa-trash-o"></i> Clear key
                            </button>
                        </form>
                    </div>
                @endif
            </div>
        </div>

        <div class="card">
            <div class="card__header">
                <h3 class="card__title">Details</h3>
            </div>
            <div class="card__body">
                <dl class="dl">
                    <dt>Status</dt>
                    <dd>
                        <span class="pill pill--{{ $statusLabel['cls'] }}">
                            <span class="pill__dot"></span>{{ $statusLabel['text'] }}
                        </span>
                    </dd>

                    <dt>Plan</dt>
                    <dd>{{ $status['plan'] ?: '—' }}</dd>

                    <dt>Expires</dt>
                    <dd>
                        @if($status['expires_at'])
                            {{ \Carbon\Carbon::parse($status['expires_at'])->diffForHumans() }}
                            <small>{{ \Carbon\Carbon::parse($status['expires_at'])->toDayDateTimeString() }}</small>
                        @else
                            <em style="color: var(--text-mute);">never</em>
                        @endif
                    </dd>

                    <dt>Bound instances</dt>
                    <dd>
                        @if($status['max_servers'])
                            {{ $status['bound_count'] }} / {{ $status['max_servers'] }}
                        @else
                            <em style="color: var(--text-mute);">—</em>
                        @endif
                    </dd>

                    <dt>Last check</dt>
                    <dd>
                        @if($status['last_check'])
                            {{ \Carbon\Carbon::parse($status['last_check'])->diffForHumans() }}
                        @else
                            <em style="color: var(--text-mute);">never</em>
                        @endif
                    </dd>
                </dl>
            </div>
        </div>
    </div>
@endsection
