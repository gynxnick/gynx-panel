<?php

namespace Pterodactyl\Services\Addons\Sources;

use Pterodactyl\Services\Addons\PluginSource;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

/**
 * SpigotMC source — stub. Phase 9.3 fills it in using the SpiGet API.
 */
class SpigotAdapter implements PluginSource
{
    public function slug(): string { return 'spigot'; }
    public function available(): bool { return false; }

    public function search(string $query, ?string $gameVersion = null, int $limit = 20): array
    {
        throw new ServiceUnavailableHttpException(null, 'SpigotMC source is not yet available.');
    }

    public function resolveDownload(string $externalId, ?string $versionId, ?string $gameVersion = null): array
    {
        throw new ServiceUnavailableHttpException(null, 'SpigotMC source is not yet available.');
    }
}
