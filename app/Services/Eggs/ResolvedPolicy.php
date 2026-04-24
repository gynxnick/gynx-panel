<?php

namespace Pterodactyl\Services\Eggs;

/**
 * Plain data holder for the resolved rule+override policy of a given
 * (server → target egg) pair. Constructed inside EggSwitcherService.
 */
class ResolvedPolicy
{
    public function __construct(
        public readonly bool $preservesFiles,
        public readonly int $cooldownMinutes,
        public readonly ?string $warningCopy,
        public readonly ?string $iconUrl = null,
        public readonly ?string $bannerUrl = null,
    ) {
    }
}
