export type PluginSourceSlug = 'modrinth' | 'hangar' | 'spigot' | 'curseforge';

export interface PluginSearchHit {
    external_id: string;
    slug: string;
    name: string;
    author: string;
    description: string;
    icon_url: string | null;
    downloads: number;
    latest_version: string | null;
    source: PluginSourceSlug;
    installed: boolean;
}

export interface InstalledPlugin {
    id: number;
    source: PluginSourceSlug;
    externalId: string;
    slug: string | null;
    name: string;
    version: string | null;
    fileName: string;
    installedAt: string;
}

export interface PluginSourceInfo {
    slug: PluginSourceSlug;
    available: boolean;
}
