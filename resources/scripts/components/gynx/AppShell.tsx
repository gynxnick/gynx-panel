import * as React from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Sidebar from '@/components/gynx/Sidebar';

/**
 * gynx.gg — app shell
 *
 * Two-column layout: persistent icon-rail sidebar + main content column.
 * Mobile: rail collapses to a thin bar at the top (handled via media query).
 *
 * The main column hosts:
 *   - TopBar / page-header (rendered by the caller as `header` slot)
 *   - optional tab strip (rendered by the caller as `tabs` slot)
 *   - children = the actual route content
 */

const Shell = styled.div`
    ${tw`flex min-h-screen w-full text-gynx-text`};
`;

const Main = styled.div`
    ${tw`flex-1 min-w-0 flex flex-col`};
`;

const TopStrip = styled.header`
    ${tw`flex-shrink-0 w-full sticky top-0 z-10`};
    background: linear-gradient(180deg, rgba(15, 17, 26, 0.85), rgba(11, 11, 15, 0.5));
    border-bottom: 1px solid var(--gynx-line);
    backdrop-filter: blur(18px) saturate(140%);
    -webkit-backdrop-filter: blur(18px) saturate(140%);
`;

const TabStrip = styled.div`
    ${tw`flex-shrink-0 w-full`};
    background: rgba(15, 17, 26, 0.55);
    border-bottom: 1px solid var(--gynx-line-soft);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
`;

const Content = styled.main`
    ${tw`flex-1 w-full min-w-0`};
`;

interface Props {
    header?: React.ReactNode;
    tabs?: React.ReactNode;
    children: React.ReactNode;
}

export default ({ header, tabs, children }: Props) => (
    <Shell>
        <Sidebar />
        <Main>
            {header && <TopStrip>{header}</TopStrip>}
            {tabs && <TabStrip>{tabs}</TabStrip>}
            <Content>{children}</Content>
        </Main>
    </Shell>
);
