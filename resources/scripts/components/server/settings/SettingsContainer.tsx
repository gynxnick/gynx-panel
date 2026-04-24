import React from 'react';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { ServerContext } from '@/state/server';
import { useStoreState } from 'easy-peasy';
import RenameServerBox from '@/components/server/settings/RenameServerBox';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import ReinstallServerBox from '@/components/server/settings/ReinstallServerBox';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import { ip } from '@/lib/formatters';
import { Button } from '@/components/elements/button/index';
import { KeyValue } from '@/components/gynx';

const Layout = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-2 gap-6`};
`;

const SftpHint = styled.div`
    ${tw`mt-4 flex items-center gap-3`};
`;

const HintBody = styled.div`
    ${tw`flex-1 rounded-md px-3 py-2`};
    background: rgba(34, 211, 238, 0.06);
    border-left: 3px solid rgba(34, 211, 238, 0.55);
    color: var(--gynx-text-dim);
    font-size: 12px;
    font-family: 'Inter', sans-serif;
    line-height: 1.55;
`;

export default () => {
    const username = useStoreState((state) => state.user.data!.username);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const node = ServerContext.useStoreState((state) => state.server.data!.node);
    const sftp = ServerContext.useStoreState((state) => state.server.data!.sftpDetails, isEqual);

    const sftpUrl = `sftp://${ip(sftp.ip)}:${sftp.port}`;
    const sftpUser = `${username}.${id}`;
    const sftpLaunch = `sftp://${sftpUser}@${ip(sftp.ip)}:${sftp.port}`;

    return (
        <ServerContentBlock title={'Settings'}>
            <FlashMessageRender byKey={'settings'} css={tw`mb-4`} />
            <Layout>
                <div css={tw`flex flex-col gap-6`}>
                    <Can action={'file.sftp'}>
                        <TitledGreyBox title={'SFTP details'}>
                            <KeyValue label={'Server address'} value={sftpUrl} copyable={sftpUrl} />
                            <KeyValue label={'Username'} value={sftpUser} copyable={sftpUser} />
                            <SftpHint>
                                <HintBody>
                                    Your SFTP password is the same password you use for this panel.
                                </HintBody>
                                <a href={sftpLaunch}>
                                    <Button.Text variant={Button.Variants.Secondary}>Launch SFTP</Button.Text>
                                </a>
                            </SftpHint>
                        </TitledGreyBox>
                    </Can>
                    <TitledGreyBox title={'Debug information'}>
                        <KeyValue label={'Node'} value={node} copyable={node} />
                        <KeyValue label={'Server ID'} value={uuid} copyable={uuid} />
                    </TitledGreyBox>
                </div>
                <div css={tw`flex flex-col gap-6`}>
                    <Can action={'settings.rename'}>
                        <RenameServerBox />
                    </Can>
                    <Can action={'settings.reinstall'}>
                        <ReinstallServerBox />
                    </Can>
                </div>
            </Layout>
        </ServerContentBlock>
    );
};
