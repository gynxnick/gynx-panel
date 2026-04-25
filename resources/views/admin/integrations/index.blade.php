@extends('layouts.admin')

@section('title')
    Integrations
@endsection

@section('content-header')
    <h1>Integrations<small>Third-party API keys used by the panel's add-on installers.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Integrations</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="alert alert-info" style="margin-bottom: 16px;">
                <strong><i class="fa fa-info-circle"></i> Where do these go?</strong>
                Saved keys live in the <code>settings</code> table under the <code>settings::gynx:integrations:*</code>
                namespace and are read by the matching adapter on every request — no <code>yarn build</code> required.
                Saving a key takes effect immediately for new add-on searches.
            </div>
        </div>
    </div>

    @foreach($rows as $key => $row)
        <div class="row">
            <div class="col-xs-12">
                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title">{{ $row['meta']['label'] }}</h3>
                        <div class="box-tools">
                            @if($row['has_db_value'])
                                <span class="label label-success"><i class="fa fa-check"></i> configured (panel DB)</span>
                            @elseif($row['has_env_value'])
                                <span class="label label-info"><i class="fa fa-info"></i> configured (.env fallback)</span>
                            @else
                                <span class="label label-default">not set</span>
                            @endif
                        </div>
                    </div>
                    <div class="box-body">
                        <p class="text-muted">{{ $row['meta']['description'] }}</p>

                        @if($row['has_env_value'] && !$row['has_db_value'])
                            <div class="alert alert-warning" style="margin-top: 0;">
                                A value is currently coming from the panel's <code>.env</code> file
                                (<code>{{ $row['meta']['env_fallback'] }}</code>). Saving a value here will take
                                priority over that.
                            </div>
                        @endif

                        <form action="{{ route('admin.integrations.update', $key) }}" method="POST">
                            {{ csrf_field() }}
                            <div class="form-group">
                                <label>{{ $row['has_db_value'] ? 'Replace key' : 'API key' }}</label>
                                <input type="password" name="value" class="form-control" autocomplete="new-password"
                                       placeholder="{{ $row['has_db_value'] ? '•••• (configured — paste a new key to replace)' : 'paste your key here' }}">
                                <p class="text-muted small">
                                    @if(!empty($row['meta']['help_url']))
                                        Get a key:
                                        <a href="{{ $row['meta']['help_url'] }}" target="_blank" rel="noreferrer noopener">
                                            {{ parse_url($row['meta']['help_url'], PHP_URL_HOST) }}
                                            <i class="fa fa-external-link" style="font-size: 10px;"></i>
                                        </a>
                                    @endif
                                </p>
                            </div>

                            <button type="submit" class="btn btn-primary btn-sm">
                                {{ $row['has_db_value'] ? 'Replace key' : 'Save key' }}
                            </button>

                            @if($row['has_db_value'])
                        </form>
                        <form action="{{ route('admin.integrations.destroy', $key) }}" method="POST"
                              style="display:inline; margin-left: 8px;"
                              onsubmit="return confirm('Clear the saved {{ $row['meta']['label'] }}? The matching source will go offline until you set a new one.')">
                            {{ csrf_field() }}
                            {{ method_field('DELETE') }}
                            <button type="submit" class="btn btn-default btn-sm">
                                <i class="fa fa-trash-o"></i> Clear
                            </button>
                        </form>
                            @else
                        </form>
                            @endif
                    </div>
                </div>
            </div>
        </div>
    @endforeach
@endsection
