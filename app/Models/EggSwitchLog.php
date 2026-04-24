<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $server_id
 * @property int $actor_user_id
 * @property int $source_egg_id
 * @property int $target_egg_id
 * @property bool $preserved_files
 * @property string $status  'queued' | 'running' | 'success' | 'failed'
 * @property string|null $error
 * @property \Carbon\Carbon|null $started_at
 * @property \Carbon\Carbon|null $completed_at
 * @property \Carbon\Carbon $created_at
 */
class EggSwitchLog extends Model
{
    public const RESOURCE_NAME = 'egg_switch_log';

    public const STATUS_QUEUED = 'queued';
    public const STATUS_RUNNING = 'running';
    public const STATUS_SUCCESS = 'success';
    public const STATUS_FAILED = 'failed';

    protected $table = 'egg_switch_logs';

    /** The legacy `updated_at` isn't on this table — it's an append-only log. */
    public const UPDATED_AT = null;

    protected $guarded = ['id', 'created_at'];

    protected $casts = [
        'server_id' => 'integer',
        'actor_user_id' => 'integer',
        'source_egg_id' => 'integer',
        'target_egg_id' => 'integer',
        'preserved_files' => 'boolean',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public static array $validationRules = [
        'server_id' => 'required|integer|exists:servers,id',
        'actor_user_id' => 'required|integer|exists:users,id',
        'source_egg_id' => 'required|integer',
        'target_egg_id' => 'required|integer',
        'preserved_files' => 'required|boolean',
        'status' => 'required|in:queued,running,success,failed',
        'error' => 'nullable|string',
    ];

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class, 'server_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
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
