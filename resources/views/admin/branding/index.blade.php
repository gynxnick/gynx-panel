@extends('layouts.gynx-admin')

@section('title', 'Branding')
@section('header-title', 'Branding')
@section('header-sub', 'Editable panel text, taglines, and the logo.')

@section('content')
    <div class="alert alert--info">
        <strong>Heads up — most edits here are live, but two things require a rebuild.</strong>
        <ul>
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

    <div class="card">
        <div class="card__header">
            <h3 class="card__title">Panel text + logo</h3>
            <form action="{{ route('admin.branding.reset') }}" method="POST" style="display:inline"
                  onsubmit="return confirm('Restore every field to its default?')">
                {{ csrf_field() }}
                <button type="submit" class="btn btn--ghost btn--sm">Reset all to defaults</button>
            </form>
        </div>
        <div class="card__body">
            <p class="card__intro">
                These values are served from the <code>settings::gynx:*</code> namespace and rendered by the
                React bundle. Changes take effect immediately for new page loads. Leave a field blank to restore
                its default.
            </p>

            <form action="{{ route('admin.branding.update') }}" method="POST">
                {{ csrf_field() }}

                @foreach($fields as $key => $meta)
                    <div class="field">
                        <label class="field__label" for="f-{{ $key }}">{{ $meta['label'] }}</label>

                        @if($key === 'auth_lede' || $key === 'dashboard_empty_body' || $key === 'modpack_install_warning')
                            <textarea id="f-{{ $key }}" name="{{ $key }}" class="field__textarea"
                                rows="{{ $key === 'modpack_install_warning' ? 4 : 2 }}"
                                maxlength="{{ $meta['max'] }}"
                                placeholder="{{ $meta['default'] }}">{{ $values[$key] }}</textarea>
                        @elseif($key === 'logo_url')
                            <input id="f-{{ $key }}" type="url" name="{{ $key }}" class="field__input"
                                maxlength="{{ $meta['max'] }}"
                                placeholder="https://cdn.gynx.gg/logo.png" value="{{ $values[$key] }}">
                            @if($values[$key])
                                <div class="field__preview">
                                    <img src="{{ $values[$key] }}" alt="">
                                </div>
                            @else
                                <span class="field__hint">Leave blank to use the bundled gynx.gg mark.</span>
                            @endif
                        @else
                            <input id="f-{{ $key }}" type="text" name="{{ $key }}" class="field__input"
                                maxlength="{{ $meta['max'] }}"
                                placeholder="{{ $meta['default'] }}" value="{{ $values[$key] }}">
                        @endif

                        @if($key !== 'logo_url')
                            <span class="field__hint"><em>Default:</em> {{ $meta['default'] ?: '(empty)' }}</span>
                        @endif
                    </div>
                @endforeach

                <button type="submit" class="btn btn--primary">Save branding</button>
            </form>
        </div>
    </div>
@endsection
