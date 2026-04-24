import React, { useContext, useEffect, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import Can from '@/components/elements/Can';
import CreateBackupButton from '@/components/server/backups/CreateBackupButton';
import FlashMessageRender from '@/components/FlashMessageRender';
import BackupRow from '@/components/server/backups/BackupRow';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import getServerBackups, { Context as ServerBackupContext } from '@/api/swr/getServerBackups';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Pagination from '@/components/elements/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArchive } from '@fortawesome/free-solid-svg-icons';
import { EmptyState } from '@/components/gynx';

const Grid = styled.div`
    ${tw`grid grid-cols-1 lg:grid-cols-2 gap-4`};
`;

const Footer = styled.div`
    ${tw`flex items-center justify-between flex-wrap gap-3 mt-6`};
    color: var(--gynx-text-dim);
    font-size: 13px;
    font-family: 'Inter', sans-serif;
`;

const BackupContainer = () => {
    const { page, setPage } = useContext(ServerBackupContext);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { data: backups, error, isValidating } = getServerBackups();

    const backupLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.backups);

    useEffect(() => {
        if (!error) {
            clearFlashes('backups');
            return;
        }
        clearAndAddHttpError({ error, key: 'backups' });
    }, [error]);

    if (!backups || (error && isValidating)) {
        return <Spinner size={'large'} centered />;
    }

    const renderList = (items: typeof backups.items) =>
        !items.length ? (
            !backupLimit ? null : (
                <EmptyState
                    size={'page'}
                    icon={<FontAwesomeIcon icon={faArchive} />}
                    title={page > 1 ? 'No more backups on this page' : 'No backups yet'}
                    body={
                        page > 1
                            ? 'Try going back to page one.'
                            : 'Create a backup to freeze the current state of your server. You can also automate this in Schedules.'
                    }
                    action={
                        page === 1 && (
                            <Can action={'backup.create'}>
                                <CreateBackupButton />
                            </Can>
                        )
                    }
                />
            )
        ) : (
            <Grid>
                {items.map((backup) => (
                    <BackupRow key={backup.uuid} backup={backup} />
                ))}
            </Grid>
        );

    return (
        <ServerContentBlock title={'Backups'}>
            <FlashMessageRender byKey={'backups'} css={tw`mb-4`} />
            <Pagination data={backups} onPageSelect={setPage}>
                {({ items }) => renderList(items)}
            </Pagination>
            {backupLimit === 0 && (
                <p css={tw`text-center text-sm text-neutral-400 mt-6`}>
                    Backups are disabled for this server.
                </p>
            )}
            <Can action={'backup.create'}>
                {backupLimit > 0 && backups.items.length > 0 && (
                    <Footer>
                        <span>
                            {backups.backupCount} of {backupLimit} backups used
                        </span>
                        {backupLimit > backups.backupCount && <CreateBackupButton />}
                    </Footer>
                )}
            </Can>
        </ServerContentBlock>
    );
};

export default () => {
    const [page, setPage] = useState<number>(1);
    return (
        <ServerBackupContext.Provider value={{ page, setPage }}>
            <BackupContainer />
        </ServerBackupContext.Provider>
    );
};
