import React, { useState } from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheck,
    faChevronDown,
    faDownload,
    faPuzzlePiece,
    faUser,
} from '@fortawesome/free-solid-svg-icons';
import { PluginSearchHit, PluginSourceSlug } from '@/api/server/plugins';
import { AddonType, AddonVersion, listAddonVersions } from '@/api/server/addons/versions';
import Spinner from '@/components/elements/Spinner';

const Card = styled.div`
    ${tw`flex flex-col p-4 rounded-xl`};
    background: var(--gynx-surface);
    border: 1px solid var(--gynx-edge);
    transition: border-color .15s ease, box-shadow .15s ease;

    &:hover {
        border-color: rgba(124, 58, 237, 0.35);
        box-shadow: 0 10px 24px -14px rgba(124, 58, 237, 0.35);
    }
`;

const Row = styled.div`
    ${tw`flex items-start gap-3`};
`;

const IconSlot = styled.div`
    ${tw`flex items-center justify-center rounded-md flex-shrink-0 overflow-hidden`};
    width: 48px;
    height: 48px;
    background: rgba(124, 58, 237, 0.08);
    border: 1px solid rgba(124, 58, 237, 0.22);
    color: #C4B5FD;
`;

const IconImg = styled.img`
    width: 48px;
    height: 48px;
    object-fit: cover;
`;

const Body = styled.div`
    ${tw`flex-1 min-w-0`};
`;

const Title = styled.h3`
    ${tw`m-0 text-sm font-medium truncate`};
    color: var(--gynx-text);
    font-family: 'Inter', sans-serif;
`;

const Meta = styled.div`
    ${tw`flex items-center gap-3 mt-1 text-xs`};
    color: var(--gynx-text-mute);
`;

const MetaItem = styled.span`
    ${tw`inline-flex items-center gap-1`};
`;

const Description = styled.p`
    ${tw`mt-2 mb-0 text-xs`};
    color: var(--gynx-text-dim);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;

/**
 * Split-button install action: a wide "install" on the left, a narrow caret
 * on the right that toggles the version picker. Sharing a border-radius
 * pairs them visually as one control.
 */
const ActionGroup = styled.div`
    ${tw`flex flex-shrink-0`};
`;

const ActionInstall = styled.button<{ $installed: boolean; $loading: boolean; $hasPicker: boolean }>`
    ${tw`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer`};
    min-width: 86px;
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.02em;
    border: 1px solid ${({ $installed }) =>
        $installed ? 'rgba(52, 211, 153, 0.4)' : 'transparent'};
    border-radius: ${({ $hasPicker }) => ($hasPicker ? '6px 0 0 6px' : '6px')};
    background: ${({ $installed }) =>
        $installed ? 'rgba(52, 211, 153, 0.12)' : 'linear-gradient(135deg, #7C3AED 0%, #9B5BFF 100%)'};
    color: ${({ $installed }) => ($installed ? '#34D399' : '#fff')};
    opacity: ${({ $loading }) => ($loading ? 0.7 : 1)};
    pointer-events: ${({ $loading, $installed }) => ($loading || $installed ? 'none' : 'auto')};
    transition: box-shadow .18s ease, transform .18s ease;

    &:hover {
        box-shadow: 0 8px 20px -8px rgba(124, 58, 237, 0.55);
    }
`;

const ActionPicker = styled.button<{ $open: boolean; $installed: boolean }>`
    ${tw`inline-flex items-center justify-center px-2 py-1.5 text-xs cursor-pointer`};
    border: 1px solid transparent;
    border-left: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 0 6px 6px 0;
    background: ${({ $open }) =>
        $open
            ? 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)'
            : 'linear-gradient(135deg, #7C3AED 0%, #9B5BFF 100%)'};
    color: #fff;
    opacity: ${({ $installed }) => ($installed ? 0.4 : 1)};
    pointer-events: ${({ $installed }) => ($installed ? 'none' : 'auto')};
    transition: background .15s ease;

    svg {
        transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0)')};
        transition: transform .2s ease;
    }
`;

const VersionPanel = styled.div`
    ${tw`mt-3 rounded-lg overflow-hidden`};
    background: rgba(15, 17, 26, 0.6);
    border: 1px solid var(--gynx-edge);
    max-height: 240px;
    overflow-y: auto;

    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 6px; }
`;

const VersionRow = styled.button`
    ${tw`flex items-center gap-3 w-full px-3 py-2 cursor-pointer text-left`};
    background: transparent;
    border: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    color: var(--gynx-text);
    transition: background .12s ease;

    &:last-child { border-bottom: 0; }
    &:hover { background: rgba(124, 58, 237, 0.1); }
    &:disabled { opacity: .55; cursor: not-allowed; }
`;

const VersionName = styled.div`
    ${tw`flex-1 min-w-0 truncate`};
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 12px;
    color: var(--gynx-text);
`;

const VersionMeta = styled.div`
    ${tw`flex items-center gap-2 flex-shrink-0`};
    font-size: 10px;
    letter-spacing: 0.04em;
    color: var(--gynx-text-mute);
`;

const ChannelTag = styled.span<{ $channel: string }>`
    ${tw`inline-block px-1.5 py-px rounded`};
    font-size: 9px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${({ $channel }) =>
        $channel === 'release' ? '#34D399' : $channel === 'beta' ? '#FCD34D' : '#F87171'};
    background: ${({ $channel }) =>
        $channel === 'release'
            ? 'rgba(52, 211, 153, 0.12)'
            : $channel === 'beta'
            ? 'rgba(252, 211, 77, 0.12)'
            : 'rgba(248, 113, 113, 0.12)'};
`;

const VersionEmpty = styled.div`
    ${tw`px-3 py-3 text-center text-xs`};
    color: var(--gynx-text-mute);
`;

const SOURCE_ACCENT: Record<PluginSourceSlug, string> = {
    modrinth: '#34D399',
    hangar: '#C4B5FD',
    spigot: '#FCD34D',
    curseforge: '#F59E0B',
};

const SourceTag = styled.span<{ $slug: PluginSourceSlug }>`
    ${tw`inline-flex items-center px-1.5 py-px rounded-md`};
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: ${({ $slug }) => SOURCE_ACCENT[$slug]};
    background: ${({ $slug }) => SOURCE_ACCENT[$slug]}22;
    border: 1px solid ${({ $slug }) => SOURCE_ACCENT[$slug]}55;
`;

type Props = {
    hit: PluginSearchHit;
    loading: boolean;
    /** What kind of addon this card represents — selects the right versions endpoint and matches install routing. */
    addonType?: AddonType;
    /** Server uuid for fetching versions. If absent, the picker stays hidden (graceful degradation). */
    serverUuid?: string;
    /** Latest install path. Optional versionId chosen from the picker. */
    onInstall: (hit: PluginSearchHit, versionId?: string) => void;
};

const formatDownloads = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
    return String(n);
};

const formatGameVersions = (gv: string[]): string => {
    if (gv.length === 0) return '';
    if (gv.length <= 2) return gv.join(', ');
    return `${gv.slice(0, 2).join(', ')} +${gv.length - 2}`;
};

export const PluginCard: React.FC<Props> = ({ hit, loading, addonType, serverUuid, onInstall }) => {
    const installed = hit.installed;
    const canPick = !installed && !!addonType && !!serverUuid;

    const [open, setOpen] = useState(false);
    const [versions, setVersions] = useState<AddonVersion[] | null>(null);
    const [loadingVersions, setLoadingVersions] = useState(false);

    const togglePicker = async () => {
        if (open) { setOpen(false); return; }
        setOpen(true);
        if (versions !== null || !addonType || !serverUuid) return;

        setLoadingVersions(true);
        try {
            const list = await listAddonVersions(serverUuid, addonType, hit.source, hit.external_id);
            setVersions(list);
        } catch {
            setVersions([]);
        } finally {
            setLoadingVersions(false);
        }
    };

    const onPickVersion = (v: AddonVersion) => {
        setOpen(false);
        onInstall(hit, v.version_id);
    };

    return (
        <Card>
            <Row>
                <IconSlot>
                    {hit.icon_url ? (
                        <IconImg src={hit.icon_url} alt={''} onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }} />
                    ) : (
                        <FontAwesomeIcon icon={faPuzzlePiece} />
                    )}
                </IconSlot>
                <Body>
                    <Title title={hit.name}>{hit.name}</Title>
                    <Meta>
                        <SourceTag $slug={hit.source}>{hit.source}</SourceTag>
                        {hit.author && (
                            <MetaItem><FontAwesomeIcon icon={faUser} /> {hit.author}</MetaItem>
                        )}
                        <MetaItem><FontAwesomeIcon icon={faDownload} /> {formatDownloads(hit.downloads)}</MetaItem>
                    </Meta>
                    {hit.description && <Description>{hit.description}</Description>}
                </Body>
                <ActionGroup>
                    <ActionInstall
                        type={'button'}
                        $installed={installed}
                        $loading={loading}
                        $hasPicker={canPick}
                        onClick={() => !installed && !loading && onInstall(hit)}
                        aria-label={installed ? 'Installed' : 'Install latest'}
                    >
                        {installed ? (
                            <><FontAwesomeIcon icon={faCheck} /> installed</>
                        ) : loading ? (
                            'installing…'
                        ) : (
                            'install'
                        )}
                    </ActionInstall>
                    {canPick && (
                        <ActionPicker
                            type={'button'}
                            $open={open}
                            $installed={installed}
                            onClick={togglePicker}
                            aria-label={'Choose a specific version'}
                            aria-expanded={open}
                        >
                            <FontAwesomeIcon icon={faChevronDown} />
                        </ActionPicker>
                    )}
                </ActionGroup>
            </Row>

            {open && (
                <VersionPanel role={'listbox'} aria-label={'available versions'}>
                    {loadingVersions ? (
                        <VersionEmpty><Spinner size={'small'} /></VersionEmpty>
                    ) : !versions || versions.length === 0 ? (
                        <VersionEmpty>
                            No versions returned. {hit.source} doesn't expose a version list for this add-on — use <em>install</em> to grab the latest.
                        </VersionEmpty>
                    ) : (
                        versions.map((v) => (
                            <VersionRow
                                key={v.version_id}
                                type={'button'}
                                role={'option'}
                                disabled={loading}
                                onClick={() => onPickVersion(v)}
                                title={`Install ${v.version}`}
                            >
                                <VersionName>{v.version || v.version_id}</VersionName>
                                <VersionMeta>
                                    {v.game_versions.length > 0 && <span>{formatGameVersions(v.game_versions)}</span>}
                                    {v.channel && <ChannelTag $channel={v.channel}>{v.channel}</ChannelTag>}
                                </VersionMeta>
                            </VersionRow>
                        ))
                    )}
                </VersionPanel>
            )}
        </Card>
    );
};

export default PluginCard;
