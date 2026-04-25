import http from '@/api/http';
import { PluginSourceSlug } from '@/api/server/plugins';

export type AddonType = 'plugin' | 'mod' | 'modpack';

export interface AddonVersion {
    version_id: string;
    version: string;
    game_versions: string[];
    loaders: string[];
    channel: string | null;
    file_name: string | null;
    downloads: number | null;
    published_at: string | null;
}

/**
 * List recent versions of an addon. Backs the install-flow's version picker.
 * Sources that can't enumerate versions return [] — the caller should treat
 * an empty list as "latest only" and fall back to the existing install path.
 */
export const listAddonVersions = async (
    uuid: string,
    type: AddonType,
    source: PluginSourceSlug,
    externalId: string,
    gameVersion?: string,
): Promise<AddonVersion[]> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/addons/versions`, {
        params: {
            type,
            source,
            external_id: externalId,
            ...(gameVersion ? { game_version: gameVersion } : {}),
        },
    });
    return (data?.data ?? []) as AddonVersion[];
};
