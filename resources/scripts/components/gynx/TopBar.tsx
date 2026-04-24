import * as React from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { ServerContext } from '@/state/server';
import { ip } from '@/lib/formatters';
import { capitalize } from '@/lib/strings';

/**
 * gynx.gg — top bar
 *
 * Two exported variants:
 *   - <TopBar.Dashboard />: simple page title, for dashboard/account surfaces.
 *   - <TopBar.Server />:    reads from ServerContext, shows server name,
 *                           description, live status pill and default
 *                           allocation. Rendered inside ServerRouter.
 *
 * Layout: horizontal flex, generous padding, two groups (title cluster / meta
 * cluster) separated by flex-grow. Height is auto-fit so long server names
 * don't clip.
 */

const Bar = styled.div`
    ${tw`mx-auto flex items-center gap-4 w-full px-6 py-4`};
    max-width: 1440px;
`;

const TitleCluster = styled.div`
    ${tw`flex-1 min-w-0`};
`;

const TitleText = styled.h1`
    ${tw`font-display text-xl md:text-2xl text-gynx-text m-0 truncate`};
    font-weight: 600;
    letter-spacing: -0.015em;
    line-height: 1.2;
`;

const Eyebrow = styled.div`
    ${tw`mb-1`};
    font-family: 'Space Grotesk', sans-serif;
    font-size: 10px;
    letter-spacing: 0.28em;
    text-transform: lowercase;
    color: var(--gynx-text-dim);
    font-weight: 500;
`;

const Subtitle = styled.p`
    ${tw`text-sm text-gynx-text-dim m-0 mt-1 line-clamp-1`};
`;

const MetaCluster = styled.div`
    ${tw`flex items-center gap-3 flex-shrink-0`};
`;

const Pill = styled.span<{ $status: string }>`
    ${tw`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium`};
    letter-spacing: 0.04em;

    ${({ $status }) => {
        switch ($status) {
            case 'running':
                return `
                    background: rgba(16, 185, 129, 0.12);
                    color: #6EE7B7;
                    border: 1px solid rgba(16, 185, 129, 0.35);
                `;
            case 'starting':
            case 'stopping':
                return `
                    background: rgba(245, 158, 11, 0.12);
                    color: #FCD34D;
                    border: 1px solid rgba(245, 158, 11, 0.35);
                `;
            case 'offline':
                return `
                    background: rgba(107, 114, 128, 0.12);
                    color: #9CA3AF;
                    border: 1px solid rgba(107, 114, 128, 0.28);
                `;
            default:
                return `
                    background: rgba(34, 211, 238, 0.10);
                    color: #67E8F9;
                    border: 1px solid rgba(34, 211, 238, 0.3);
                `;
        }
    }}

    &::before {
        content: '';
        width: 6px; height: 6px; border-radius: 50%;
        background: currentColor;
        box-shadow: 0 0 8px currentColor;
        ${({ $status }) => $status === 'running' ? 'animation: gynx-pulse 2.2s ease-in-out infinite;' : ''}
    }

    @keyframes gynx-pulse {
        0%, 100% { opacity: 1; }
        50%      { opacity: 0.4; }
    }
`;

const Allocation = styled.span`
    ${tw`font-mono text-xs text-gynx-text-dim px-2.5 py-1 rounded-gynx-sm`};
    background: rgba(11, 11, 15, 0.5);
    border: 1px solid var(--gynx-line-soft);
`;

interface DashboardProps {
    title: string;
    eyebrow?: string;
    actions?: React.ReactNode;
}

const Dashboard: React.FC<DashboardProps> = ({ title, eyebrow, actions }) => (
    <Bar>
        <TitleCluster>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <TitleText>{title}</TitleText>
        </TitleCluster>
        {actions && <MetaCluster>{actions}</MetaCluster>}
    </Bar>
);

const Server: React.FC<{ actions?: React.ReactNode }> = ({ actions }) => {
    const name = ServerContext.useStoreState((state) => state.server.data?.name || '');
    const description = ServerContext.useStoreState((state) => state.server.data?.description || '');
    const status = ServerContext.useStoreState((state) => state.status.value);
    const allocation = ServerContext.useStoreState((state) => {
        const match = state.server.data?.allocations.find((a) => a.isDefault);
        return !match ? null : `${match.alias || ip(match.ip)}:${match.port}`;
    });

    return (
        <Bar>
            <TitleCluster>
                <Eyebrow>server</Eyebrow>
                <TitleText>{name}</TitleText>
                {description && <Subtitle>{description}</Subtitle>}
            </TitleCluster>
            <MetaCluster>
                {allocation && <Allocation>{allocation}</Allocation>}
                <Pill $status={status || 'unknown'}>
                    {status ? capitalize(status) : 'Offline'}
                </Pill>
                {actions}
            </MetaCluster>
        </Bar>
    );
};

const TopBar = { Dashboard, Server };
export default TopBar;
