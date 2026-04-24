import React, { useEffect, useState } from 'react';
import getServerDatabases from '@/api/server/databases/getServerDatabases';
import { ServerContext } from '@/state/server';
import { httpErrorToHuman } from '@/api/http';
import FlashMessageRender from '@/components/FlashMessageRender';
import DatabaseRow from '@/components/server/databases/DatabaseRow';
import Spinner from '@/components/elements/Spinner';
import CreateDatabaseButton from '@/components/server/databases/CreateDatabaseButton';
import Can from '@/components/elements/Can';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import Fade from '@/components/elements/Fade';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useDeepMemoize } from '@/plugins/useDeepMemoize';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase } from '@fortawesome/free-solid-svg-icons';
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

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const databaseLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.databases);

    const { addError, clearFlashes } = useFlash();
    const [loading, setLoading] = useState(true);

    const databases = useDeepMemoize(ServerContext.useStoreState((state) => state.databases.data));
    const setDatabases = ServerContext.useStoreActions((state) => state.databases.setDatabases);

    useEffect(() => {
        setLoading(!databases.length);
        clearFlashes('databases');

        getServerDatabases(uuid)
            .then((databases) => setDatabases(databases))
            .catch((error) => {
                console.error(error);
                addError({ key: 'databases', message: httpErrorToHuman(error) });
            })
            .then(() => setLoading(false));
    }, []);

    return (
        <ServerContentBlock title={'Databases'}>
            <FlashMessageRender byKey={'databases'} css={tw`mb-4`} />
            {!databases.length && loading ? (
                <Spinner size={'large'} centered />
            ) : (
                <Fade timeout={150}>
                    <>
                        {databases.length > 0 ? (
                            <Grid>
                                {databases.map((database) => (
                                    <DatabaseRow key={database.id} database={database} />
                                ))}
                            </Grid>
                        ) : (
                            <EmptyState
                                size={'page'}
                                icon={<FontAwesomeIcon icon={faDatabase} />}
                                title={databaseLimit > 0 ? 'No databases yet' : 'Databases unavailable'}
                                body={
                                    databaseLimit > 0
                                        ? 'Spin up your first MySQL database to start storing state for your server.'
                                        : 'This server isn’t configured to host databases. Contact your admin if you need one.'
                                }
                                action={
                                    databaseLimit > 0 && (
                                        <Can action={'database.create'}>
                                            <CreateDatabaseButton />
                                        </Can>
                                    )
                                }
                            />
                        )}
                        <Can action={'database.create'}>
                            {databaseLimit > 0 && databases.length > 0 && (
                                <Footer>
                                    <span>
                                        {databases.length} of {databaseLimit} databases in use
                                    </span>
                                    {databaseLimit !== databases.length && <CreateDatabaseButton />}
                                </Footer>
                            )}
                        </Can>
                    </>
                </Fade>
            )}
        </ServerContentBlock>
    );
};
