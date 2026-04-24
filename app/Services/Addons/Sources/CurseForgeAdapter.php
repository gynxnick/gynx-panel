<?php

namespace Pterodactyl\Services\Addons\Sources;

use Pterodactyl\Services\Addons\PluginSource;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

/**
 * CurseForge source — stub. Phase 9.4 fills it in; needs
 * CURSEFORGE_API_KEY env var to enable.
 */
class CurseForgeAdapter implements PluginSource
{
    public function slug(): string { return 'curseforge'; }
    public function available(): bool
    {
        return !empty(env('CURSEFORGE_API_KEY'));
    }

    public function search(string $query, ?string $gameVersion = null, int $limit = 20): array
    {
        throw new ServiceUnavailableHttpException(null, 'CurseForge source is not yet available.');
    }

    public function resolveDownload(string $externalId, ?string $versionId, ?string $gameVersion = null): array
    {
        throw new ServiceUnavailableHttpException(null, 'CurseForge source is not yet available.');
    }
}
