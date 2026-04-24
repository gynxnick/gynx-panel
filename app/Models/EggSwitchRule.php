<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int|null $source_egg_id
 * @property int $target_egg_id
 * @property bool $preserves_files
 * @property int $cooldown_minutes
 * @property string|null $warning_copy
 * @property bool $enabled
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class EggSwitchRule extends Model
{
    public const RESOURCE_NAME = 'egg_switch_rule';

    protected $table = 'egg_switch_rules';

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $casts = [
        'source_egg_id' => 'integer',
        'target_egg_id' => 'integer',
        'preserves_files' => 'boolean',
        'cooldown_minutes' => 'integer',
        'enabled' => 'boolean',
    ];

    public static array $validationRules = [
        'source_egg_id' => 'nullable|integer|exists:eggs,id',
        'target_egg_id' => 'required|integer|exists:eggs,id',
        'preserves_files' => 'required|boolean',
        'cooldown_minutes' => 'required|integer|min:0',
        'warning_copy' => 'nullable|string',
        'icon_url' => 'nullable|string|url|max:2048',
        'enabled' => 'required|boolean',
    ];

    /** Route-bind by primary key, not uuid (no uuid column on this table). */
    public function getRouteKeyName(): string
    {
        return 'id';
    }

    public function sourceEgg(): BelongsTo
    {
        return $this->belongsTo(Egg::class, 'source_egg_id');
    }

    public function targetEgg(): BelongsTo
    {
        return $this->belongsTo(Egg::class, 'target_egg_id');
    }
}
