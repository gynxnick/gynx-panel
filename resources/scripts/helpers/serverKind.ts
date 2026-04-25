/**
 * Heuristics for figuring out which install pages an egg supports.
 *
 * Pterodactyl doesn't surface "is this a Paper-style server" as first-class
 * metadata, but the egg's startup invocation almost always names the launcher
 * jar — that's enough to tell apart Bukkit-family (plugins) from mod-loader
 * family (mods/modpacks). Anything that doesn't match is treated as
 * unsupported and the related nav link is hidden.
 *
 * Hybrid platforms (Mohist / Arclight / Magma) run a Forge mod loader AND
 * accept Bukkit plugins, so they enable both sides.
 */

interface ServerLike {
    invocation?: string;
    dockerImage?: string;
}

export interface AddonCapabilities {
    plugins: boolean;
    mods: boolean;
    modpacks: boolean;
}

const PLUGIN_PATTERNS: RegExp[] = [
    /paper(?:[-_]\d|\.jar)/i,
    /spigot(?:[-_]\d|\.jar)/i,
    /craftbukkit(?:[-_]\d|\.jar)/i,
    /purpur(?:[-_]\d|\.jar)/i,
    /folia(?:[-_]\d|\.jar)/i,
    /pufferfish(?:[-_]\d|\.jar)/i,
];

const MOD_PATTERNS: RegExp[] = [
    /forge(?:[-_]\d|\.jar)/i,
    /\bfabric[-_]server[-_]launch/i,
    /\bquilt[-_]server[-_]launch/i,
    /neoforge/i,
    /unix_args\.txt/i,            // Forge >= 1.17 launcher arg file
    /@user_jvm_args/,             // The same Forge launcher pattern in invocation
    /libraries\/net\/minecraftforge/i,
];

const HYBRID_PATTERNS: RegExp[] = [
    /mohist(?:[-_]\d|\.jar)/i,
    /arclight(?:[-_]\d|\.jar)/i,
    /magma(?:[-_]\d|\.jar)/i,
    /catserver/i,
];

export function getAddonCapabilities(server: ServerLike | null | undefined): AddonCapabilities {
    if (!server) return { plugins: false, mods: false, modpacks: false };

    const haystack = `${server.invocation ?? ''} ${server.dockerImage ?? ''}`;

    const isHybrid = HYBRID_PATTERNS.some((re) => re.test(haystack));
    const isPlugin = isHybrid || PLUGIN_PATTERNS.some((re) => re.test(haystack));
    const isMod = isHybrid || MOD_PATTERNS.some((re) => re.test(haystack));

    return {
        plugins: isPlugin,
        // Modpacks live in the same modded ecosystem; if a server can take
        // mods it can take a modpack (which is just a manifest of mods +
        // configs).
        mods: isMod,
        modpacks: isMod,
    };
}
