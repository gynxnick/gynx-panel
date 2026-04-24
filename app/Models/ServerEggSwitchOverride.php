<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $server_id
 * @property int $target_egg_id
 * @property bool $allowed
 * @property bool|null $preserves_files
 * @property string|null $reason
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class ServerEggSwitchOverride extends Model
{
    public const RESOURCE_NAME = 'server_egg_switch_override';

    protected $table = 'server_egg_switch_overrides';

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $casts = [
        'server_id' => 'integer',
        'target_egg_id' => 'integer',
        'allowed' => 'boolean',
        'preserves_files' => 'boolean',
    ];

    public static array $validationRules = [
        'server_id' => 'required|integer|exists:servers,id',
        'target_egg_id' => 'required|integer|exists:eggs,id',
        'allowed' => 'required|boolean',
        'preserves_files' => 'nullable|boolean',
        'reason' => 'nullable|string',
    ];

    /** Route-bind by primary key, not uuid. */
    public function getRouteKeyName(): string
    {
        return 'id';
    }

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class, 'server_id');
    }

    public function targetEgg(): BelongsTo
    {
        return $this->belongsTo(Egg::class, 'target_egg_id');
    }
}
