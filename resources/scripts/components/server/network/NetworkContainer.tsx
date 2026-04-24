import React, { useEffect, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import { useFlashKey } from '@/plugins/useFlash';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { ServerContext } from '@/state/server';
import AllocationRow from '@/components/server/network/AllocationRow';
import Button from '@/components/elements/Button';
import createServerAllocation from '@/api/server/network/createServerAllocation';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import Can from '@/components/elements/Can';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import getServerAllocations from '@/api/swr/getServerAllocations';
import isEqual from 'react-fast-compare';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNetworkWired } from '@fortawesome/free-solid-svg-icons';
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

const NetworkContainer = () => {
    const [loading, setLoading] = useState(false);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const allocationLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.allocations);
    const allocations = ServerContext.useStoreState((state) => state.server.data!.allocations, isEqual);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const { data, error, mutate } = getServerAllocations();

    useEffect(() => {
        mutate(allocations);
    }, []);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    useDeepCompareEffect(() => {
        if (!data) return;
        setServerFromState((state) => ({ ...state, allocations: data }));
    }, [data]);

    const onCreateAllocation = () => {
        clearFlashes();
        setLoading(true);
        createServerAllocation(uuid)
            .then((allocation) => {
                setServerFromState((s) => ({ ...s, allocations: s.allocations.concat(allocation) }));
                return mutate(data?.concat(allocation), false);
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    };

    // Sort: primary first, then by port.
    const sorted = data
        ? [...data].sort((a, b) => {
              if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
              return a.port - b.port;
          })
        : null;

    return (
        <ServerContentBlock showFlashKey={'server:network'} title={'Network'}>
            <SpinnerOverlay visible={loading} />
            {!sorted ? (
                <Spinner size={'large'} centered />
            ) : sorted.length === 0 ? (
                <EmptyState
                    size={'page'}
                    icon={<FontAwesomeIcon icon={faNetworkWired} />}
                    title={'No allocations'}
                    body={'This server has no network allocations assigned. Contact your admin if this looks wrong.'}
                />
            ) : (
                <>
                    <Grid>
                        {sorted.map((allocation) => (
                            <AllocationRow key={`${allocation.ip}:${allocation.port}`} allocation={allocation} />
                        ))}
                    </Grid>
                    {allocationLimit > 0 && (
                        <Can action={'allocation.create'}>
                            <Footer>
                                <span>
                                    {sorted.length} of {allocationLimit} allocations in use
                                </span>
                                {allocationLimit > sorted.length && (
                                    <Button color={'primary'} onClick={onCreateAllocation}>
                                        Create Allocation
                                    </Button>
                                )}
                            </Footer>
                        </Can>
                    )}
                </>
            )}
        </ServerContentBlock>
    );
};

export default NetworkContainer;
