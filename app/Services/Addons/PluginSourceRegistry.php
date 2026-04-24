<?php

namespace Pterodactyl\Services\Addons;

use Pterodactyl\Services\Addons\Sources\CurseForgeAdapter;
use Pterodactyl\Services\Addons\Sources\HangarAdapter;
use Pterodactyl\Services\Addons\Sources\ModrinthAdapter;
use Pterodactyl\Services\Addons\Sources\SpigotAdapter;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PluginSourceRegistry
{
    /** @var PluginSource[] */
    private array $sources;

    public function __construct(
        ModrinthAdapter $modrinth,
        HangarAdapter $hangar,
        SpigotAdapter $spigot,
        CurseForgeAdapter $curseforge,
    ) {
        $this->sources = [
            $modrinth->slug() => $modrinth,
            $hangar->slug() => $hangar,
            $spigot->slug() => $spigot,
            $curseforge->slug() => $curseforge,
        ];
    }

    /** @return PluginSource[] indexed by slug */
    public function all(): array
    {
        return $this->sources;
    }

    /** Available sources only. */
    public function enabled(): array
    {
        return array_filter($this->sources, fn (PluginSource $s) => $s->available());
    }

    public function get(string $slug): PluginSource
    {
        if (!isset($this->sources[$slug])) {
            throw new NotFoundHttpException("Unknown plugin source: {$slug}");
        }
        return $this->sources[$slug];
    }
}
