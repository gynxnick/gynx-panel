<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $server_id
 * @property string $source  'modrinth' | 'hangar' | 'spigot' | 'curseforge'
 * @property string $external_id
 * @property string|null $slug
 * @property string $name
 * @property string|null $version
 * @property string $file_name
 * @property string|null $file_hash
 * @property \Carbon\Carbon $installed_at
 * @property int $installed_by
 */
class AddonPlugin extends Model
{
    public const RESOURCE_NAME = 'addon_plugin';

    public const SOURCE_MODRINTH = 'modrinth';
    public const SOURCE_HANGAR = 'hangar';
    public const SOURCE_SPIGOT = 'spigot';
    public const SOURCE_CURSEFORGE = 'curseforge';

    protected $table = 'addon_plugins';

    /** append-only install log; no update_at */
    public const UPDATED_AT = null;

    protected $guarded = ['id', 'installed_at'];

    protected $casts = [
        'server_id' => 'integer',
        'installed_by' => 'integer',
        'installed_at' => 'datetime',
    ];

    public static array $validationRules = [
        'server_id' => 'required|integer|exists:servers,id',
        'source' => 'required|in:modrinth,hangar,spigot,curseforge',
        'external_id' => 'required|string',
        'slug' => 'nullable|string',
        'name' => 'required|string',
        'version' => 'nullable|string',
        'file_name' => 'required|string',
        'file_hash' => 'nullable|string',
        'installed_by' => 'required|integer|exists:users,id',
    ];

    /** Route-bind by primary key, not uuid. */
    public function getRouteKeyName(): string
    {
        return 'id';
    }

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    public function installer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'installed_by');
    }
}
