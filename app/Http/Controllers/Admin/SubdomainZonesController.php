<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\SubdomainZone;
use Pterodactyl\Services\Subdomains\Providers\CloudflareDnsProvider;

/**
 * Admin: register parent zones (e.g. play.gynx.gg) that the panel can issue
 * subdomains under. Each zone holds a scoped Cloudflare API token (Zone:DNS:Edit).
 *
 * Token validation happens at save time: we hit Cloudflare with the token and
 * zone id and only persist if the call succeeds. Lets admins fix bad config
 * before users attempt claims.
 */
class SubdomainZonesController extends Controller
{
    public function __construct(
        protected AlertsMessageBag $alert,
        protected ViewFactory $view,
    ) {
    }

    public function index(): View
    {
        $zones = SubdomainZone::query()
            ->withCount('records')
            ->orderBy('label')
            ->get();

        return $this->view->make('admin.subdomains.index', [
            'zones' => $zones,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'label' => 'required|string|max:100',
            'domain' => 'required|string|max:253',
            'provider_zone_id' => 'required|string|max:64',
            'provider_token' => 'required|string|max:512',
            'enabled' => 'nullable|boolean',
        ]);

        // Probe Cloudflare so a typo'd token / zone id fails LOUDLY at
        // registration instead of silently when the first user tries to claim.
        try {
            $stub = new SubdomainZone();
            $stub->provider_token = $data['provider_token'];
            $stub->provider_zone_id = $data['provider_zone_id'];
            CloudflareDnsProvider::forZone($stub)->verifyAccess();
        } catch (\Throwable $e) {
            $this->alert->danger('Cloudflare rejected those credentials: ' . $e->getMessage())->flash();
            return redirect()->route('admin.subdomains.index');
        }

        SubdomainZone::query()->create([
            'label' => $data['label'],
            'domain' => strtolower(trim($data['domain'])),
            'provider' => SubdomainZone::PROVIDER_CLOUDFLARE,
            'provider_zone_id' => $data['provider_zone_id'],
            'provider_token' => $data['provider_token'],
            'enabled' => (bool) ($data['enabled'] ?? true),
        ]);

        $this->alert->success('Zone added.')->flash();
        return redirect()->route('admin.subdomains.index');
    }

    public function toggle(SubdomainZone $zone): RedirectResponse
    {
        $zone->forceFill(['enabled' => !$zone->enabled])->save();
        $this->alert->success($zone->enabled ? 'Zone enabled.' : 'Zone disabled.')->flash();
        return redirect()->route('admin.subdomains.index');
    }

    public function destroy(SubdomainZone $zone): RedirectResponse
    {
        if ($zone->records()->count() > 0) {
            $this->alert->danger('Zone still has active records. Release them first.')->flash();
            return redirect()->route('admin.subdomains.index');
        }
        $zone->delete();
        $this->alert->success('Zone removed.')->flash();
        return redirect()->route('admin.subdomains.index');
    }
}
