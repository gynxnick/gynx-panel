<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Models\Permission;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\SubdomainRecord;
use Pterodactyl\Models\SubdomainZone;
use Pterodactyl\Services\Subdomains\SubdomainService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Per-server subdomain endpoints for end users.
 *
 *   GET    /servers/{server}/subdomains/zones     — pickable parent domains
 *   GET    /servers/{server}/subdomains            — claims this server holds
 *   POST   /servers/{server}/subdomains            — claim a hostname under a zone
 *   DELETE /servers/{server}/subdomains/{record}   — release a claim
 *
 * Admin-only registration of zones lives in Admin\SubdomainZonesController.
 */
class SubdomainController extends ClientApiController
{
    public function __construct(
        private SubdomainService $service,
    ) {
        parent::__construct();
    }

    public function zones(ClientApiRequest $request, Server $server): JsonResponse
    {
        $this->ensurePermission($request, $server, Permission::ACTION_SUBDOMAIN_READ);

        $zones = SubdomainZone::query()
            ->where('enabled', true)
            ->orderBy('label')
            ->get(['id', 'label', 'domain']);

        return new JsonResponse([
            'data' => $zones->map(fn ($z) => [
                'id' => $z->id,
                'label' => $z->label,
                'domain' => $z->domain,
            ])->all(),
        ]);
    }

    public function index(ClientApiRequest $request, Server $server): JsonResponse
    {
        $this->ensurePermission($request, $server, Permission::ACTION_SUBDOMAIN_READ);

        $records = SubdomainRecord::query()
            ->with('zone:id,label,domain')
            ->where('server_id', $server->id)
            ->orderBy('record_type')
            ->get();

        return new JsonResponse([
            'data' => $records->map(fn (SubdomainRecord $r) => [
                'id' => $r->id,
                'hostname' => $r->hostname,
                'recordType' => $r->record_type,
                'fqdn' => $r->fqdn(),
                'zone' => [
                    'id' => $r->zone?->id,
                    'label' => $r->zone?->label,
                    'domain' => $r->zone?->domain,
                ],
                'createdAt' => optional($r->created_at)->toIso8601String(),
            ])->all(),
        ]);
    }

    public function store(ClientApiRequest $request, Server $server): JsonResponse
    {
        $this->ensurePermission($request, $server, Permission::ACTION_SUBDOMAIN_CREATE);

        $data = $request->validate([
            'zone_id' => 'required|integer|exists:subdomain_zones,id',
            'hostname' => 'required|string|max:63',
        ]);

        $zone = SubdomainZone::query()->findOrFail($data['zone_id']);
        $records = $this->service->claim($server, $zone, $data['hostname']);

        try {
            Activity::event('server:subdomain.create')
                ->property('zone', $zone->domain)
                ->property('hostname', $data['hostname'])
                ->log();
        } catch (\Throwable $e) {
            report($e);
        }

        return new JsonResponse([
            'data' => array_map(fn (SubdomainRecord $r) => [
                'id' => $r->id,
                'hostname' => $r->hostname,
                'recordType' => $r->record_type,
                'fqdn' => $r->fqdn(),
            ], $records),
        ], Response::HTTP_CREATED);
    }

    public function destroy(ClientApiRequest $request, Server $server, int $record): JsonResponse
    {
        $this->ensurePermission($request, $server, Permission::ACTION_SUBDOMAIN_DELETE);

        $row = SubdomainRecord::query()
            ->where('server_id', $server->id)
            ->where('id', $record)
            ->first();
        if (!$row) {
            throw new NotFoundHttpException('Subdomain record not found on this server.');
        }

        $fqdn = $row->fqdn();
        $this->service->release($row);

        try {
            Activity::event('server:subdomain.delete')->property('fqdn', $fqdn)->log();
        } catch (\Throwable $e) {
            report($e);
        }

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    private function ensurePermission(ClientApiRequest $request, Server $server, string $permission): void
    {
        if (!$request->user()->can($permission, $server)) {
            abort(403, 'You do not have permission to perform this action on this server.');
        }
    }
}
