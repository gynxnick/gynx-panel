@extends('layouts.gynx-admin')

@section('title', 'Integrations')
@section('header-title', 'Integrations')
@section('header-sub', "Third-party API keys used by the panel's add-on installers.")

@section('content')
    <div class="alert alert--info">
        <strong>Where do these go?</strong>
        Saved keys live in the <code>settings</code> table under the <code>settings::gynx:integrations:*</code>
        namespace and are read by the matching adapter on every request — no <code>yarn build</code> required.
        Saving a key takes effect immediately for new add-on searches.
    </div>

    @foreach($rows as $key => $row)
        <div class="card">
            <div class="card__header">
                <h3 class="card__title">{{ $row['meta']['label'] }}</h3>
                @if($row['has_db_value'])
                    <span class="pill pill--success"><span class="pill__dot"></span>configured (panel DB)</span>
                @elseif($row['has_env_value'])
                    <span class="pill pill--info"><span class="pill__dot"></span>configured (.env fallback)</span>
                @else
                    <span class="pill">not set</span>
                @endif
            </div>
            <div class="card__body">
                <p class="card__intro">{{ $row['meta']['description'] }}</p>

                @if($row['has_env_value'] && !$row['has_db_value'])
                    <div class="alert alert--warning">
                        A value is currently coming from the panel's <code>.env</code> file
                        (<code>{{ $row['meta']['env_fallback'] }}</code>). Saving a value here will take
                        priority over that.
                    </div>
                @endif

                <form action="{{ route('admin.integrations.update', $key) }}" method="POST">
                    {{ csrf_field() }}
                    <div class="field">
                        <label class="field__label" for="f-{{ $key }}">
                            {{ $row['has_db_value'] ? 'Replace key' : 'API key' }}
                        </label>
                        <input id="f-{{ $key }}" type="password" name="value"
                               class="field__input" autocomplete="new-password"
                               placeholder="{{ $row['has_db_value'] ? '•••• (configured — paste a new key to replace)' : 'paste your key here' }}">
                        @if(!empty($row['meta']['help_url']))
                            <span class="field__hint">
                                Get a key:
                                <a href="{{ $row['meta']['help_url'] }}" target="_blank" rel="noreferrer noopener">
                                    {{ parse_url($row['meta']['help_url'], PHP_URL_HOST) }}
                                </a>
                            </span>
                        @endif
                    </div>
                    <button type="submit" class="btn btn--primary">
                        {{ $row['has_db_value'] ? 'Replace key' : 'Save key' }}
                    </button>
                </form>

                @if($row['has_db_value'])
                    <form action="{{ route('admin.integrations.destroy', $key) }}" method="POST"
                          style="display:inline-block; margin-left: 8px;"
                          onsubmit="return confirm('Clear the saved {{ $row['meta']['label'] }}? The matching source will go offline until you set a new one.')">
                        {{ csrf_field() }}
                        {{ method_field('DELETE') }}
                        <button type="submit" class="btn btn--ghost">
                            <i class="fa fa-trash-o"></i> Clear
                        </button>
                    </form>
                @endif
            </div>
        </div>
    @endforeach
@endsection
