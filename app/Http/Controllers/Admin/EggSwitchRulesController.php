<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\EggSwitchRule;

class EggSwitchRulesController extends Controller
{
    public const INTRO_COPY_KEY = 'settings::egg_switch:intro_copy';
    public const DEFAULT_INTRO_COPY = 'Convert this server to a different game without opening a ticket. Review the warnings before you switch — some targets wipe files.';

    public function __construct(
        protected AlertsMessageBag $alert,
        protected ViewFactory $view,
        protected SettingsRepositoryInterface $settings,
    ) {
    }

    public function index(): View
    {
        $rules = EggSwitchRule::query()
            ->with(['sourceEgg:id,name', 'targetEgg:id,name'])
            ->orderBy('enabled', 'desc')
            ->orderBy('target_egg_id')
            ->get();

        // Map of source egg id ('0' for global / null) → [target_egg_id, ...]
        $takenTargets = [];
        foreach ($rules as $rule) {
            $key = (string) ($rule->source_egg_id ?? 0);
            $takenTargets[$key] = $takenTargets[$key] ?? [];
            $takenTargets[$key][] = (int) $rule->target_egg_id;
        }

        return $this->view->make('admin.egg-switch.index', [
            'rules' => $rules,
            'eggs' => Egg::query()
                ->with('nest:id,name')
                ->orderBy('name')
                ->get(['id', 'name', 'nest_id']),
            'takenTargets' => $takenTargets,
            'introCopy' => (string) $this->settings->get(self::INTRO_COPY_KEY, self::DEFAULT_INTRO_COPY),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateRuleInput($request);

        $data['enabled'] = true;

        if ((int) ($data['source_egg_id'] ?? 0) === (int) $data['target_egg_id']) {
            $this->alert->danger('Source and target egg cannot be the same.')->flash();
            return redirect()->route('admin.egg-switch.index');
        }

        try {
            EggSwitchRule::query()->create($data);
            $this->alert->success('Rule created.')->flash();
        } catch (\Illuminate\Database\QueryException $e) {
            if (str_contains($e->getMessage(), 'Duplicate') || str_contains($e->getMessage(), 'unique')) {
                $this->alert->danger('A rule for that source/target pair already exists.')->flash();
            } else {
                $this->alert->danger('Could not create rule: ' . $e->getMessage())->flash();
            }
        }

        return redirect()->route('admin.egg-switch.index');
    }

    public function edit(EggSwitchRule $rule): View
    {
        return $this->view->make('admin.egg-switch.edit', [
            'rule' => $rule,
            'eggs' => Egg::query()
                ->with('nest:id,name')
                ->orderBy('name')
                ->get(['id', 'name', 'nest_id']),
        ]);
    }

    public function update(Request $request, EggSwitchRule $rule): RedirectResponse
    {
        $data = $this->validateRuleInput($request);

        if ((int) ($data['source_egg_id'] ?? 0) === (int) $data['target_egg_id']) {
            $this->alert->danger('Source and target egg cannot be the same.')->flash();
            return redirect()->route('admin.egg-switch.edit', $rule);
        }

        try {
            $rule->forceFill($data)->save();
            $this->alert->success('Rule updated.')->flash();
        } catch (\Illuminate\Database\QueryException $e) {
            if (str_contains($e->getMessage(), 'Duplicate') || str_contains($e->getMessage(), 'unique')) {
                $this->alert->danger('Another rule already exists for that source/target pair.')->flash();
                return redirect()->route('admin.egg-switch.edit', $rule);
            }
            $this->alert->danger('Could not update rule: ' . $e->getMessage())->flash();
            return redirect()->route('admin.egg-switch.edit', $rule);
        }

        return redirect()->route('admin.egg-switch.index');
    }

    private function validateRuleInput(Request $request): array
    {
        $data = $request->validate([
            'source_egg_id' => 'nullable|integer|exists:eggs,id',
            'target_egg_id' => 'required|integer|exists:eggs,id',
            'preserves_files' => 'nullable|boolean',
            'cooldown_minutes' => 'required|integer|min:0|max:10080',
            'warning_copy' => 'nullable|string|max:500',
            'icon_url' => 'nullable|url|max:2048',
            'banner_url' => 'nullable|url|max:2048',
        ]);

        $data['preserves_files'] = (bool) ($data['preserves_files'] ?? false);
        $data['icon_url'] = $data['icon_url'] ?? null;
        $data['banner_url'] = $data['banner_url'] ?? null;
        $data['warning_copy'] = $data['warning_copy'] ?? null;
        $data['source_egg_id'] = $data['source_egg_id'] ?? null;

        return $data;
    }

    public function updateCopy(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'intro_copy' => 'nullable|string|max:1000',
        ]);

        $value = trim((string) ($data['intro_copy'] ?? ''));
        $this->settings->set(self::INTRO_COPY_KEY, $value === '' ? self::DEFAULT_INTRO_COPY : $value);
        $this->alert->success('Intro copy updated.')->flash();

        return redirect()->route('admin.egg-switch.index');
    }

    public function toggle(EggSwitchRule $rule): RedirectResponse
    {
        $rule->forceFill(['enabled' => !$rule->enabled])->save();
        $this->alert->success($rule->enabled ? 'Rule enabled.' : 'Rule disabled.')->flash();
        return redirect()->route('admin.egg-switch.index');
    }

    public function destroy(EggSwitchRule $rule): RedirectResponse
    {
        $rule->delete();
        $this->alert->success('Rule removed.')->flash();
        return redirect()->route('admin.egg-switch.index');
    }
}
