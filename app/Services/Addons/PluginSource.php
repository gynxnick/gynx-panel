<?php

namespace Pterodactyl\Services\Addons;

/**
 * Interface every plugin source adapter (Modrinth / Hangar / Spigot /
 * CurseForge) implements. The controller + service talk to this, never
 * to concrete HTTP APIs.
 */
interface PluginSource
{
    /** Lowercase key matching AddonPlugin::SOURCE_* constants. */
    public function slug(): string;

    /** Whether this source is currently available (API key set, etc.). */
    public function available(): bool;

    /**
     * Search the source for plugins matching $query. Optional game-version
     * filter narrows to versions compatible with that Minecraft version.
     *
     * @return array<int,array{
     *   external_id:string, slug:string, name:string, author:?string,
     *   description:?string, icon_url:?string, downloads:?int,
     *   latest_version:?string, source:string
     * }>
     */
    public function search(string $query, ?string $gameVersion = null, int $limit = 20): array;

    /**
     * Resolve a downloadable file for a given project. Returns the metadata
     * the service needs to write the install record and hand the URL to
     * Wings. Version is optional — pass null to pick the latest version
     * compatible with $gameVersion.
     *
     * @return array{url:string, file_name:string, file_hash:?string, version:string, version_id:string}
     */
    public function resolveDownload(string $externalId, ?string $versionId, ?string $gameVersion = null): array;
}
