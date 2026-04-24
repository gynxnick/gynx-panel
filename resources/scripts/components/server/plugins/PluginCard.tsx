import React from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faDownload, faPuzzlePiece, faUser } from '@fortawesome/free-solid-svg-icons';
import { PluginSearchHit, PluginSourceSlug } from '@/api/server/plugins';

const Card = styled.div`
    ${tw`flex items-start gap-3 p-4 rounded-xl`};
    background: var(--gynx-surface);
    border: 1px solid var(--gynx-edge);
    transition: border-color .15s ease, box-shadow .15s ease;

    &:hover {
        border-color: rgba(124, 58, 237, 0.35);
        box-shadow: 0 10px 24px -14px rgba(124, 58, 237, 0.35);
    }
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

const Action = styled.button<{ $installed: boolean; $loading: boolean }>`
    ${tw`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer flex-shrink-0`};
    min-width: 96px;
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.02em;
    border: 1px solid ${({ $installed }) =>
        $installed ? 'rgba(52, 211, 153, 0.4)' : 'transparent'};
    background: ${({ $installed }) =>
        $installed ? 'rgba(52, 211, 153, 0.12)' : 'linear-gradient(135deg, #7C3AED 0%, #9B5BFF 100%)'};
    color: ${({ $installed }) => ($installed ? '#34D399' : '#fff')};
    opacity: ${({ $loading }) => ($loading ? 0.7 : 1)};
    pointer-events: ${({ $loading, $installed }) => ($loading || $installed ? 'none' : 'auto')};
    transition: box-shadow .18s ease, transform .18s ease;

    &:hover {
        box-shadow: 0 8px 20px -8px rgba(124, 58, 237, 0.55);
        transform: translateY(-1px);
    }
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
    onInstall: (hit: PluginSearchHit) => void;
};

const formatDownloads = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
    return String(n);
};

export const PluginCard: React.FC<Props> = ({ hit, loading, onInstall }) => {
    const installed = hit.installed;

    return (
        <Card>
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
            <Action
                type={'button'}
                $installed={installed}
                $loading={loading}
                onClick={() => !installed && !loading && onInstall(hit)}
                aria-label={installed ? 'Installed' : 'Install plugin'}
            >
                {installed ? (
                    <><FontAwesomeIcon icon={faCheck} /> installed</>
                ) : loading ? (
                    'installing…'
                ) : (
                    'install'
                )}
            </Action>
        </Card>
    );
};

export default PluginCard;
