<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\EggSwitch;

use Pterodactyl\Models\Permission;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class RequestEggSwitchRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_CONTROL_EGG_SWITCH;
    }

    public function rules(): array
    {
        return [
            'target_egg_id' => 'required|integer|exists:eggs,id',
        ];
    }
}
