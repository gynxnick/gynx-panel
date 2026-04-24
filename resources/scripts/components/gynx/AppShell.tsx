import * as React from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Sidebar from '@/components/gynx/Sidebar';

/**
 * gynx.gg — app shell
 *
 * Two-column layout: the wide Sidebar (owns ALL navigation — global +
 * contextual server/account tabs) and a main content column. The sidebar
 * collapses to 64px on demand and hides entirely on narrow viewports.
 *
 * The main column hosts:
 *   - TopBar / page-header (rendered by the caller as `header` slot)
 *   - children = the actual route content
 *
 * The `tabs` slot from session 2 is gone — the Sidebar handles tabs now.
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
    border-bottom: 1px solid var(--gynx-edge);
    backdrop-filter: blur(18px) saturate(140%);
    -webkit-backdrop-filter: blur(18px) saturate(140%);
`;

const Content = styled.main`
    ${tw`flex-1 w-full min-w-0`};
`;

interface Props {
    header?: React.ReactNode;
    children: React.ReactNode;
}

export default ({ header, children }: Props) => (
    <Shell>
        <Sidebar />
        <Main>
            {header && <TopStrip>{header}</TopStrip>}
            <Content>{children}</Content>
        </Main>
    </Shell>
);
