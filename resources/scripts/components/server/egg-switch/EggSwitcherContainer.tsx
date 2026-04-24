import React, { useEffect, useState } from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad } from '@fortawesome/free-solid-svg-icons';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import FlashMessageRender from '@/components/FlashMessageRender';
import { httpErrorToHuman } from '@/api/http';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import { EmptyState } from '@/components/gynx';
import EggCard from './EggCard';
import ConfirmDialog from './ConfirmDialog';
import ProgressPanel from './ProgressPanel';
import {
    EggSwitchOption,
    EggSwitchPreview,
    listEggSwitchOptions,
    previewEggSwitch,
    requestEggSwitch,
} from '@/api/server/eggSwitch';

const Grid = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`};
`;

const Intro = styled.p`
    ${tw`text-sm mb-5`};
    color: var(--gynx-text-dim);
    font-family: 'Inter', sans-serif;
    line-height: 1.55;
    max-width: 70ch;
`;

export default () => {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);
    const serverName = ServerContext.useStoreState((s) => s.server.data!.name);
    const { clearFlashes, clearAndAddHttpError } = useFlash();

    const [loading, setLoading] = useState(true);
    const [options, setOptions] = useState<EggSwitchOption[]>([]);
    const [introCopy, setIntroCopy] = useState<string | null>(null);

    const [selected, setSelected] = useState<EggSwitchOption | null>(null);
    const [preview, setPreview] = useState<EggSwitchPreview | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [loadingConfirm, setLoadingConfirm] = useState(false);

    const [logId, setLogId] = useState<number | null>(null);

    useEffect(() => {
        clearFlashes('egg-switch');
        listEggSwitchOptions(uuid)
            .then((res) => {
                setOptions(res.options);
                setIntroCopy(res.introCopy);
            })
            .catch((e) => clearAndAddHttpError({ key: 'egg-switch', error: e }))
            .then(() => setLoading(false));
    }, [uuid]);

    const onSelect = async (option: EggSwitchOption) => {
        setSelected(option);
        setPreview(null);
        setLoadingPreview(true);
        try {
            const p = await previewEggSwitch(uuid, option.eggId);
            setPreview(p);
        } catch (e) {
            clearAndAddHttpError({ key: 'egg-switch', error: e });
            setSelected(null);
        } finally {
            setLoadingPreview(false);
        }
    };

    const onConfirm = async () => {
        if (!selected) return;
        setLoadingConfirm(true);
        clearFlashes('egg-switch');
        try {
            const result = await requestEggSwitch(uuid, selected.eggId);
            setLogId(result.logId);
            setSelected(null);
            setPreview(null);
        } catch (e) {
            clearAndAddHttpError({ key: 'egg-switch', error: e });
        } finally {
            setLoadingConfirm(false);
        }
    };

    const renderBody = () => {
        if (logId !== null) {
            return (
                <ProgressPanel
                    serverUuid={uuid}
                    logId={logId}
                    onDone={(status) => {
                        if (status === 'success') {
                            window.setTimeout(() => {
                                window.location.href = `/server/${uuid}`;
                            }, 1800);
                        }
                    }}
                />
            );
        }

        if (loading) return <Spinner size={'large'} centered />;

        if (options.length === 0) {
            return (
                <EmptyState
                    size={'page'}
                    icon={<FontAwesomeIcon icon={faGamepad} />}
                    title={'No available games'}
                    body={
                        'No eggs are configured as switch targets for this server yet. ' +
                        'Ask your panel admin to add an egg-switch rule.'
                    }
                />
            );
        }

        return (
            <>
                {introCopy && <Intro>{introCopy}</Intro>}
                <Grid>
                    {options.map((o) => (
                        <EggCard key={o.eggId} option={o} onSelect={onSelect} />
                    ))}
                </Grid>
            </>
        );
    };

    return (
        <ServerContentBlock title={'Game'}>
            <FlashMessageRender byKey={'egg-switch'} css={tw`mb-4`} />
            {renderBody()}
            {selected && (
                <ConfirmDialog
                    option={selected}
                    preview={preview}
                    loadingPreview={loadingPreview}
                    loadingConfirm={loadingConfirm}
                    serverName={serverName}
                    visible={true}
                    onDismiss={() => { setSelected(null); setPreview(null); }}
                    onConfirm={onConfirm}
                />
            )}
        </ServerContentBlock>
    );
};
