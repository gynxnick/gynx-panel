import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPuzzlePiece, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { debounce } from 'debounce';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { httpErrorToHuman } from '@/api/http';
import { ServerContext } from '@/state/server';
import { EmptyState, Card as GynxCard, Pill } from '@/components/gynx';
import SourceFilter from './SourceFilter';
import PluginCard from './PluginCard';
import {
    installPlugin,
    InstalledPlugin,
    listInstalledPlugins,
    listPluginSources,
    PluginSearchHit,
    PluginSourceInfo,
    PluginSourceSlug,
    removeInstalledPlugin,
    searchPlugins,
} from '@/api/server/plugins';

const Toolbar = styled.div`
    ${tw`flex flex-col gap-3 mb-4`};
`;

const SearchBox = styled.div`
    ${tw`relative`};

    input {
        width: 100%;
        min-height: 42px;
        padding: 10px 12px 10px 38px;
        background: rgba(15, 17, 26, 0.95);
        border: 1px solid var(--gynx-edge);
        border-radius: 10px;
        color: var(--gynx-text);
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        transition: border-color .15s ease, box-shadow .15s ease;
    }

    input::placeholder {
        color: var(--gynx-text-mute);
    }

    input:focus {
        border-color: rgba(124, 58, 237, 0.55);
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.18);
        outline: none;
    }
`;

const SearchIcon = styled(FontAwesomeIcon)`
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--gynx-text-mute);
    font-size: 13px;
    pointer-events: none;
`;

const Tabs = styled.div`
    ${tw`flex items-center gap-1 p-1 rounded-lg mb-4`};
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--gynx-edge);
    width: fit-content;
`;

const Tab = styled.button<{ $active: boolean }>`
    ${tw`px-3 py-1.5 rounded-md text-xs font-medium border-0 cursor-pointer`};
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.02em;
    background: ${({ $active }) => ($active ? 'rgba(124, 58, 237, 0.18)' : 'transparent')};
    color: ${({ $active }) => ($active ? '#C4B5FD' : 'var(--gynx-text-dim)')};
    transition: color .15s ease, background .15s ease;

    &:hover {
        color: var(--gynx-text);
    }
`;

const Grid = styled.div`
    ${tw`grid grid-cols-1 lg:grid-cols-2 gap-3`};
`;

const Hint = styled.p`
    ${tw`text-xs m-0 mt-2`};
    color: var(--gynx-text-mute);
    font-family: 'Inter', sans-serif;
`;

const InstalledRow = styled.div`
    ${tw`flex items-center gap-3 px-3 py-2.5 rounded-md`};
    &:hover {
        background: rgba(255, 255, 255, 0.03);
    }
`;

const FileName = styled.code`
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 11px;
    color: var(--gynx-text-mute);
    display: block;
    margin-top: 2px;
`;

const IconButton = styled.button<{ $danger?: boolean }>`
    ${tw`inline-flex items-center justify-center rounded-md cursor-pointer flex-shrink-0`};
    width: 28px;
    height: 28px;
    background: transparent;
    border: 1px solid var(--gynx-edge-2);
    color: ${({ $danger }) => ($danger ? '#F87171' : 'var(--gynx-text-dim)')};
    transition: color .15s ease, border-color .15s ease, background .15s ease;

    &:hover {
        color: ${({ $danger }) => ($danger ? '#F87171' : 'var(--gynx-text)')};
        background: ${({ $danger }) => ($danger ? 'rgba(248, 113, 113, 0.1)' : 'rgba(255, 255, 255, 0.04)')};
        border-color: ${({ $danger }) => ($danger ? 'rgba(248, 113, 113, 0.35)' : 'rgba(124, 58, 237, 0.35)')};
    }
`;

type Tab = 'browse' | 'installed';

export default () => {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();

    const [tab, setTab] = useState<Tab>('browse');
    const [sources, setSources] = useState<PluginSourceInfo[]>([]);
    const [source, setSource] = useState<PluginSourceSlug>('modrinth');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PluginSearchHit[]>([]);
    const [searching, setSearching] = useState(false);
    const [installing, setInstalling] = useState<string | null>(null);

    const [installed, setInstalled] = useState<InstalledPlugin[]>([]);
    const [loadingInstalled, setLoadingInstalled] = useState(true);

    useEffect(() => {
        clearFlashes('plugins');
        listPluginSources(uuid)
            .then(setSources)
            .catch((e) => clearAndAddHttpError({ key: 'plugins', error: e }));
        listInstalledPlugins(uuid)
            .then(setInstalled)
            .catch((e) => clearAndAddHttpError({ key: 'plugins', error: e }))
            .then(() => setLoadingInstalled(false));
    }, [uuid]);

    const installedIds = useMemo(
        () => new Set(installed.map((p) => `${p.source}:${p.externalId}`)),
        [installed],
    );

    // Annotate results with the latest installed-status (covers the case
    // where the user just installed something — results are stale).
    const annotated = useMemo(
        () => results.map((r) => ({ ...r, installed: installedIds.has(`${r.source}:${r.external_id}`) })),
        [results, installedIds],
    );

    const runSearch = useRef(
        debounce((q: string, src: PluginSourceSlug) => {
            setSearching(true);
            searchPlugins(uuid, src, q)
                .then((hits) => setResults(hits))
                .catch((e) => clearAndAddHttpError({ key: 'plugins', error: e }))
                .then(() => setSearching(false));
        }, 400),
    ).current;

    const onQueryChange = (q: string) => {
        setQuery(q);
        if (q.trim().length < 2) {
            setResults([]);
            return;
        }
        runSearch(q.trim(), source);
    };

    // Re-run when the source changes while there's an active query.
    useEffect(() => {
        if (query.trim().length >= 2) runSearch(query.trim(), source);
    }, [source]);

    const onInstall = useCallback(async (hit: PluginSearchHit, versionId?: string) => {
        setInstalling(`${hit.source}:${hit.external_id}`);
        clearFlashes('plugins');
        try {
            await installPlugin(uuid, {
                source: hit.source,
                external_id: hit.external_id,
                ...(versionId ? { version_id: versionId } : {}),
            });
            const fresh = await listInstalledPlugins(uuid);
            setInstalled(fresh);
            addFlash({
                key: 'plugins',
                type: 'success',
                message: `Installed ${hit.name}${versionId ? ' (selected version)' : ''}. Restart the server for it to load.`,
            });
        } catch (e) {
            clearAndAddHttpError({ key: 'plugins', error: e });
        } finally {
            setInstalling(null);
        }
    }, [uuid]);

    const onRemove = useCallback(async (p: InstalledPlugin) => {
        if (!window.confirm(`Remove ${p.name}? The jar will be deleted from /plugins/.`)) return;
        clearFlashes('plugins');
        try {
            await removeInstalledPlugin(uuid, p.id);
            setInstalled((prev) => prev.filter((x) => x.id !== p.id));
            addFlash({
                key: 'plugins',
                type: 'success',
                message: `Removed ${p.name}. Restart the server to unload it from memory.`,
            });
        } catch (e) {
            clearAndAddHttpError({ key: 'plugins', error: e });
        }
    }, [uuid]);

    const renderBrowse = () => (
        <>
            <Toolbar>
                <SearchBox>
                    <SearchIcon icon={faSearch} />
                    <input
                        type={'text'}
                        placeholder={'Search plugins — e.g. "essentials", "luckperms", "worldedit"'}
                        value={query}
                        onChange={(e) => onQueryChange(e.currentTarget.value)}
                        autoFocus
                    />
                </SearchBox>
                <SourceFilter sources={sources} selected={source} onSelect={setSource} />
            </Toolbar>

            {searching ? (
                <Spinner centered />
            ) : annotated.length === 0 && query.trim().length >= 2 ? (
                <EmptyState
                    size={'section'}
                    icon={<FontAwesomeIcon icon={faSearch} />}
                    title={'No matches'}
                    body={`Nothing on ${source} for "${query}". Try a different query or source.`}
                />
            ) : annotated.length > 0 ? (
                <Grid>
                    {annotated.map((hit) => (
                        <PluginCard
                            key={`${hit.source}:${hit.external_id}`}
                            hit={hit}
                            loading={installing === `${hit.source}:${hit.external_id}`}
                            addonType={'plugin'}
                            serverUuid={uuid}
                            onInstall={onInstall}
                        />
                    ))}
                </Grid>
            ) : (
                <Hint>Type at least 2 characters to search {source}.</Hint>
            )}
        </>
    );

    const renderInstalled = () => {
        if (loadingInstalled) return <Spinner centered />;
        if (installed.length === 0) {
            return (
                <EmptyState
                    size={'page'}
                    icon={<FontAwesomeIcon icon={faPuzzlePiece} />}
                    title={'No plugins installed'}
                    body={'Browse Modrinth and install your first plugin from the Browse tab.'}
                />
            );
        }

        return (
            <GynxCard>
                {installed.map((p) => (
                    <InstalledRow key={p.id}>
                        <div style={{ color: '#C4B5FD', width: 20, textAlign: 'center' }}>
                            <FontAwesomeIcon icon={faPuzzlePiece} />
                        </div>
                        <div css={tw`flex-1 min-w-0`}>
                            <div css={tw`flex items-center gap-2`}>
                                <strong css={tw`text-sm`}>{p.name}</strong>
                                {p.version && <Pill variant={'idle'}>{p.version}</Pill>}
                            </div>
                            <FileName title={p.fileName}>{p.fileName}</FileName>
                        </div>
                        <IconButton
                            $danger
                            type={'button'}
                            onClick={() => onRemove(p)}
                            title={`Remove ${p.name}`}
                        >
                            <FontAwesomeIcon icon={faTrashAlt} />
                        </IconButton>
                    </InstalledRow>
                ))}
            </GynxCard>
        );
    };

    return (
        <ServerContentBlock title={'Plugins'}>
            <FlashMessageRender byKey={'plugins'} css={tw`mb-4`} />

            <Tabs role={'tablist'} aria-label={'plugins tabs'}>
                <Tab role={'tab'} aria-selected={tab === 'browse'} $active={tab === 'browse'} onClick={() => setTab('browse')}>
                    Browse
                </Tab>
                <Tab role={'tab'} aria-selected={tab === 'installed'} $active={tab === 'installed'} onClick={() => setTab('installed')}>
                    Installed{installed.length > 0 && ` · ${installed.length}`}
                </Tab>
            </Tabs>

            {tab === 'browse' ? renderBrowse() : renderInstalled()}
        </ServerContentBlock>
    );
};
