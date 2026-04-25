import * as React from 'react';
import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import Can from '@/components/elements/Can';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import { ServerContext } from '@/state/server';
import routes, { ServerNavGroup } from '@/routers/routes';

/**
 * Server-scoped nav tabs. Lifted out of Sidebar so we can safely consume
 * ServerContext (which Sidebar otherwise can't, since it also renders on
 * dashboard / account routes that have no ServerContext.Provider).
 *
 * Filters routes by both `permission` (existing) and the new `compatible`
 * predicate that lets each route opt out for incompatible eggs. Keeps the
 * Plugins / Mods / Modpacks tabs from showing on a vanilla server, etc.
 */

const GROUP_ORDER: ServerNavGroup[] = ['management', 'monitoring', 'config'];
const GROUP_LABELS: Record<ServerNavGroup, string> = {
    management: 'manage',
    monitoring: 'monitor',
    config: 'config',
};

const Divider = styled.div`
    margin: 8px 16px;
    height: 1px;
    background: rgba(255, 255, 255, 0.05);
`;

const EyebrowRow = styled.div<{ $collapsed: boolean }>`
    ${tw`px-4 pt-5 pb-1`};
    font-family: 'Space Grotesk', sans-serif;
    font-size: 12px;
    letter-spacing: 0.16em;
    text-transform: lowercase;
    color: var(--gynx-text);
    font-weight: 700;
    opacity: ${({ $collapsed }) => ($collapsed ? 0 : 0.95)};
    height: ${({ $collapsed }) => ($collapsed ? 14 : 28)}px;
    transition: opacity .18s ease, height .2s ease;
    display: flex;
    align-items: center;
    overflow: hidden;
`;

const itemBase = css`
    ${tw`relative flex items-center no-underline mx-2 px-3 py-2 rounded-lg`};
    gap: 12px;
    min-height: 40px;
    color: var(--gynx-text);
    opacity: 0.82;
    font-size: 13.5px;
    font-weight: 500;
    letter-spacing: 0.005em;
    transition: opacity .18s ease, color .18s ease, background .18s ease;
    cursor: pointer;
    border: 0;
    background: transparent;
    text-align: left;
    pointer-events: auto;

    &:hover {
        color: #fff;
        opacity: 1;
        background: rgba(34, 211, 238, 0.08);
    }
`;

const activeCss = css`
    color: #fff;
    opacity: 1;
    background: rgba(124, 58, 237, 0.16);
`;

const ItemLink = styled(NavLink)`
    ${itemBase}
    &.active {
        ${activeCss}
    }
`;

const IconCell = styled.span`
    ${tw`flex items-center justify-center flex-shrink-0`};
    width: 20px;
    height: 20px;
    font-size: 14px;
`;

const LabelCell = styled.span<{ $collapsed: boolean }>`
    ${tw`flex-1 truncate`};
    opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
    transform: ${({ $collapsed }) => ($collapsed ? 'translateX(-4px)' : 'translateX(0)')};
    transition: opacity .18s ease, transform .2s ease;
    pointer-events: ${({ $collapsed }) => ($collapsed ? 'none' : 'auto')};
    white-space: nowrap;
`;

interface Props {
    serverUrlBase: string;
    collapsed: boolean;
}

const wrapTip = (collapsed: boolean, label: string, node: React.ReactElement) =>
    collapsed ? (
        <Tooltip placement={'right'} content={label}>
            {node}
        </Tooltip>
    ) : node;

const NavItem: React.FC<{
    icon: IconDefinition;
    label: string;
    to: string;
    exact?: boolean;
    collapsed: boolean;
}> = ({ icon, label, to, exact, collapsed }) =>
    wrapTip(
        collapsed,
        label,
        <ItemLink to={to} exact={exact} activeClassName={'active'}>
            <IconCell>
                <FontAwesomeIcon icon={icon} fixedWidth />
            </IconCell>
            <LabelCell $collapsed={collapsed}>{label}</LabelCell>
        </ItemLink>,
    );

const ServerNavSection: React.FC<Props> = ({ serverUrlBase, collapsed }) => {
    const server = ServerContext.useStoreState((s) => s.server.data);

    const grouped = useMemo(() => {
        const result: Record<string, typeof routes.server> = {};
        for (const r of routes.server) {
            if (!r.name) continue;
            if (r.compatible && server && !r.compatible(server)) continue;
            const g = r.group || 'ungrouped';
            (result[g] = result[g] || []).push(r);
        }
        return result;
    }, [server]);

    return (
        <>
            <Divider />
            {GROUP_ORDER.map((group) => {
                const items = grouped[group];
                if (!items || items.length === 0) return null;
                return (
                    <React.Fragment key={group}>
                        <EyebrowRow $collapsed={collapsed}>{GROUP_LABELS[group]}</EyebrowRow>
                        {items.map((route) => {
                            const node = (
                                <NavItem
                                    key={route.path}
                                    icon={route.icon!}
                                    label={route.name!}
                                    to={`${serverUrlBase}${route.path === '/' ? '' : route.path}`}
                                    exact={route.exact}
                                    collapsed={collapsed}
                                />
                            );
                            return route.permission ? (
                                <Can key={route.path} action={route.permission} matchAny>
                                    {node}
                                </Can>
                            ) : node;
                        })}
                    </React.Fragment>
                );
            })}
        </>
    );
};

export default ServerNavSection;
