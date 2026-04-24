<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\EggSwitchLog;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\Eggs\EggSwitcherService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\EggSwitch\PreviewEggSwitchRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\EggSwitch\RequestEggSwitchRequest;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class EggSwitchController extends ClientApiController
{
    public function __construct(
        private EggSwitcherService $switcher,
    ) {
        parent::__construct();
    }

    /**
     * GET /servers/{server}/egg-switch/options
     */
    public function options(ClientApiRequest $request, Server $server): JsonResponse
    {
        $options = $this->switcher->listAllowedTargets($server, $request->user());

        return new JsonResponse(['data' => $options]);
    }

    /**
     * POST /servers/{server}/egg-switch/preview
     */
    public function preview(PreviewEggSwitchRequest $request, Server $server): JsonResponse
    {
        $target = Egg::query()->find($request->integer('target_egg_id'));
        if (!$target) {
            throw new NotFoundHttpException('Target egg not found.');
        }

        $data = $this->switcher->preview($server, $target, $request->user());

        return new JsonResponse(['data' => $data]);
    }

    /**
     * POST /servers/{server}/egg-switch
     *
     * @throws \Throwable
     */
    public function request(RequestEggSwitchRequest $request, Server $server): JsonResponse
    {
        $target = Egg::query()->find($request->integer('target_egg_id'));
        if (!$target) {
            throw new NotFoundHttpException('Target egg not found.');
        }

        $log = $this->switcher->request($server, $target, $request->user());

        Activity::event('server:egg-switch.request')
            ->property(['source_egg_id' => $log->source_egg_id, 'target_egg_id' => $log->target_egg_id])
            ->log();

        return new JsonResponse([
            'data' => [
                'logId' => $log->id,
                'status' => $log->status,
                'trackUrl' => "/api/client/servers/{$server->uuid}/egg-switch/status/{$log->id}",
            ],
        ], Response::HTTP_ACCEPTED);
    }

    /**
     * GET /servers/{server}/egg-switch/status/{log}
     */
    public function status(ClientApiRequest $request, Server $server, int $log): JsonResponse
    {
        $log = EggSwitchLog::query()
            ->where('server_id', $server->id)
            ->where('id', $log)
            ->firstOrFail();

        return new JsonResponse([
            'data' => [
                'logId' => $log->id,
                'status' => $log->status,
                'error' => $log->error,
                'startedAt' => $log->started_at,
                'completedAt' => $log->completed_at,
            ],
        ]);
    }
}
