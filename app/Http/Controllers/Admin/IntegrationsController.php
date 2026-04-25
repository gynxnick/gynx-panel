<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Controllers\Controller;

/**
 * Integrations / third-party API keys.
 *
 * Each key is stored in the settings table under the
 * `settings::gynx:integrations:*` namespace. Adapters read via
 * integrationKey('curseforge_api_key') which checks the DB first, then
 * falls back to the matching env var so existing .env-based setups keep
 * working without migration.
 *
 * The form never echoes the saved value back to the page — once a key is
 * stored we render "•••• configured" and provide a separate "Clear" button.
 * That's the right default for secrets even on an admin-only page.
 */
class IntegrationsController extends Controller
{
    public const KEYS = [
        'curseforge_api_key' => [
            'label' => 'CurseForge API key',
            'description' => 'Required to enable the CurseForge source on the plugin / mod / modpack install pages. Get a key from console.curseforge.com.',
            'env_fallback' => 'CURSEFORGE_API_KEY',
            'help_url' => 'https://console.curseforge.com/?#/api-keys',
        ],
    ];

    public function __construct(
        protected AlertsMessageBag $alert,
        protected ViewFactory $view,
        protected SettingsRepositoryInterface $settings,
    ) {
    }

    public function index(): View
    {
        $rows = [];
        foreach (self::KEYS as $key => $meta) {
            $stored = (string) $this->settings->get("settings::gynx:integrations:{$key}", '');
            $envVal = $meta['env_fallback'] ? (string) env($meta['env_fallback'], '') : '';
            $rows[$key] = [
                'meta' => $meta,
                'has_db_value' => $stored !== '',
                'has_env_value' => $envVal !== '',
            ];
        }

        return $this->view->make('admin.integrations.index', [
            'rows' => $rows,
        ]);
    }

    public function update(Request $request, string $key): RedirectResponse
    {
        if (!isset(self::KEYS[$key])) {
            abort(404);
        }

        $value = trim((string) $request->input('value', ''));
        if ($value === '') {
            $this->alert->danger('Paste a key into the field, or use Clear to remove it.')->flash();
            return redirect()->route('admin.integrations.index');
        }

        if (strlen($value) > 512) {
            $this->alert->danger('That looks longer than any real API key — refusing to save.')->flash();
            return redirect()->route('admin.integrations.index');
        }

        $this->settings->set("settings::gynx:integrations:{$key}", $value);
        $this->alert->success(self::KEYS[$key]['label'] . ' saved.')->flash();

        return redirect()->route('admin.integrations.index');
    }

    public function destroy(string $key): RedirectResponse
    {
        if (!isset(self::KEYS[$key])) {
            abort(404);
        }

        $this->settings->set("settings::gynx:integrations:{$key}", '');
        $this->alert->success(self::KEYS[$key]['label'] . ' cleared.')->flash();

        return redirect()->route('admin.integrations.index');
    }

    /**
     * Helper used by adapters to read a key by name. DB value takes priority;
     * if blank, falls back to the env var named in KEYS[$key]['env_fallback'].
     */
    public static function get(SettingsRepositoryInterface $settings, string $key): string
    {
        $stored = (string) $settings->get("settings::gynx:integrations:{$key}", '');
        if ($stored !== '') return $stored;

        $envName = self::KEYS[$key]['env_fallback'] ?? null;
        return $envName ? (string) env($envName, '') : '';
    }
}
