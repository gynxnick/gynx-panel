<?php

namespace Pterodactyl\Services\Addons\Sources;

use Pterodactyl\Services\Addons\PluginSource;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

/**
 * Hangar (PaperMC) source — stub. Phase 9.2 fills it in.
 */
class HangarAdapter implements PluginSource
{
    public function slug(): string { return 'hangar'; }
    public function available(): bool { return false; }

    public function search(string $query, ?string $gameVersion = null, int $limit = 20): array
    {
        throw new ServiceUnavailableHttpException(null, 'Hangar source is not yet available.');
    }

    public function resolveDownload(string $externalId, ?string $versionId, ?string $gameVersion = null): array
    {
        throw new ServiceUnavailableHttpException(null, 'Hangar source is not yet available.');
    }
}
