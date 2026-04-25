import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faExclamationTriangle,
    faMap,
    faScroll,
    faTrashAlt,
    faCircleNotch,
} from '@fortawesome/free-solid-svg-icons';
import { ServerContext } from '@/state/server';
import { isRustServer } from '@/helpers/gameCommands';
import loadDirectory from '@/api/server/files/loadDirectory';
import deleteFiles from '@/api/server/files/deleteFiles';

/**
 * Rust-only convenience panel. Stops the server, deletes the chosen wipe
 * artefacts under server/<identity>/, then restarts.
 *
 * Three presets, each strict superset of the previous:
 *   - Map wipe         → terrain + buildings (.sav files)
 *   - BP wipe          → map files + everyone's blueprints
 *   - Full wipe        → map + BP + player persistence (data/loadouts)
 *
 * The identity directory varies per server (Pterodactyl egg sets it via
 * SERVER_IDENTITY env var). We list /server/ at startup, find the
 * subdirectories there, and offer to wipe inside the first one. Most
 * single-instance servers only have one identity dir.
 */

const Card = styled.section`
    ${tw`rounded-xl`};
    background: var(--gynx-surface);
    border: 1px solid var(--gynx-edge);
    overflow: hidden;
`;

const Header = styled.header`
    ${tw`flex items-center gap-3 px-4 py-3`};
    border-bottom: 1px solid var(--gynx-edge);
    color: var(--gynx-text);
`;

const Eyebrow = styled.span`
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: lowercase;
    color: var(--gynx-text-mute);
    font-family: 'Space Grotesk', sans-serif;
`;

const Title = styled.h3`
    ${tw`m-0 text-sm font-medium`};
    color: var(--gynx-text);
    font-family: 'Space Grotesk', sans-serif;
`;

const Body = styled.div`
    ${tw`p-4 grid grid-cols-1 sm:grid-cols-3 gap-3`};
`;

const PresetButton = styled.button<{ $variant: 'soft' | 'warn' | 'danger' }>`
    ${tw`flex flex-col items-start gap-2 p-3 rounded-lg cursor-pointer text-left`};
    background: ${({ $variant }) =>
        $variant === 'danger'
            ? 'rgba(248, 113, 113, 0.06)'
            : $variant === 'warn'
            ? 'rgba(252, 211, 77, 0.06)'
            : 'rgba(124, 58, 237, 0.06)'};
    border: 1px solid ${({ $variant }) =>
        $variant === 'danger'
            ? 'rgba(248, 113, 113, 0.3)'
            : $variant === 'warn'
            ? 'rgba(252, 211, 77, 0.3)'
            : 'rgba(124, 58, 237, 0.3)'};
    color: var(--gynx-text);
    transition: background .15s ease, border-color .15s ease, transform .15s ease;

    &:hover:not(:disabled) {
        background: ${({ $variant }) =>
            $variant === 'danger'
                ? 'rgba(248, 113, 113, 0.12)'
                : $variant === 'warn'
                ? 'rgba(252, 211, 77, 0.12)'
                : 'rgba(124, 58, 237, 0.12)'};
        transform: translateY(-1px);
    }

    &:disabled { opacity: .5; cursor: not-allowed; }
`;

const PresetTitle = styled.div`
    ${tw`flex items-center gap-2 text-sm font-medium`};
`;

const PresetBody = styled.div`
    ${tw`text-xs`};
    color: var(--gynx-text-dim);
    line-height: 1.5;
`;

const Banner = styled.div`
    ${tw`px-4 py-2 text-xs`};
    border-top: 1px solid var(--gynx-edge);
    color: var(--gynx-text-mute);
    font-family: 'JetBrains Mono', ui-monospace, monospace;
`;

type WipeMode = 'map' | 'bp' | 'full';

const WIPE_PRESETS: Record<WipeMode, { label: string; body: string; patterns: RegExp[]; variant: 'soft' | 'warn' | 'danger' }> = {
    map: {
        label: 'Map wipe',
        body: 'Wipes the procedural map, all buildings, and entities. Keeps blueprints and player data.',
        patterns: [/\.sav$/i, /\.sav\.\d+$/i, /\.map$/i, /\.map\.\d+$/i],
        variant: 'soft',
    },
    bp: {
        label: 'BP wipe',
        body: 'Map wipe + everyone loses learned blueprints. Player progression resets, accounts kept.',
        patterns: [
            /\.sav$/i, /\.sav\.\d+$/i, /\.map$/i, /\.map\.\d+$/i,
            /Player\.blueprints/i,
        ],
        variant: 'warn',
    },
    full: {
        label: 'Full wipe',
        body: 'Map + BP + player accounts. Everyone joins as a new spawn. Reserved for season starts.',
        patterns: [
            /\.sav$/i, /\.sav\.\d+$/i, /\.map$/i, /\.map\.\d+$/i,
            /Player\.blueprints/i,
            /UserPersistence/i,
            /sv\.files/i,
        ],
        variant: 'danger',
    },
};

const RustWipePanel: React.FC = () => {
    const server = ServerContext.useStoreState((s) => s.server.data);
    const uuid = server?.uuid;
    const status = ServerContext.useStoreState((s) => s.status.value);
    const { connected, instance } = ServerContext.useStoreState((s) => s.socket);

    const [identity, setIdentity] = useState<string | null>(null);
    const [identityErr, setIdentityErr] = useState<string | null>(null);
    const [running, setRunning] = useState<WipeMode | null>(null);

    // Discover the identity directory under /server/.
    useEffect(() => {
        if (!uuid) return;
        loadDirectory(uuid, '/server')
            .then((entries) => {
                const dirs = entries.filter((e) => !e.isFile).map((e) => e.name);
                if (dirs.length === 0) {
                    setIdentityErr('No identity directory found under /server/.');
                } else {
                    setIdentity(dirs[0]);
                }
            })
            .catch(() => setIdentityErr('Could not list /server/. Is the server installed?'));
    }, [uuid]);

    const wipe = useCallback(
        async (mode: WipeMode) => {
            if (!uuid || !identity) return;
            const preset = WIPE_PRESETS[mode];
            const ok = window.confirm(
                `Run "${preset.label}" on this server?\n\n` +
                `What this does:\n  • ${preset.body}\n\n` +
                `What we'll do:\n` +
                `  1. Stop the server (if running).\n` +
                `  2. Delete matching files under /server/${identity}/.\n` +
                `  3. Start the server back up.\n\n` +
                `This is not reversible without a backup.`,
            );
            if (!ok) return;

            setRunning(mode);

            try {
                // 1. Stop the server if it's not already off.
                if (instance && connected && status !== 'offline') {
                    instance.send('set state', 'stop');
                    // Wait briefly for the daemon to process the stop. The
                    // socket store updates `status` reactively so we don't
                    // need to introspect the response.
                    await new Promise((r) => setTimeout(r, 1500));
                }

                // 2. Discover files in the identity dir and pick out matches.
                const entries = await loadDirectory(uuid, `/server/${identity}`);
                const targets = entries
                    .filter((e) => e.isFile && preset.patterns.some((re) => re.test(e.name)))
                    .map((e) => e.name);

                if (targets.length > 0) {
                    await deleteFiles(uuid, `/server/${identity}`, targets);
                }

                // 3. Restart.
                if (instance && connected) {
                    instance.send('set state', 'start');
                }

                window.alert(
                    targets.length === 0
                        ? `No files matched in /server/${identity}/. Nothing to delete; server restarted.`
                        : `${preset.label} complete — deleted ${targets.length} file(s). Server restarting.`,
                );
            } catch (e: any) {
                window.alert(`Wipe failed: ${e?.message || e}`);
            } finally {
                setRunning(null);
            }
        },
        [uuid, identity, instance, connected, status],
    );

    if (!isRustServer(server || undefined)) return null;

    return (
        <Card>
            <Header>
                <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#FCD34D' }} />
                <div style={{ flex: 1 }}>
                    <Eyebrow>rust server tools</Eyebrow>
                    <Title>Server wipe</Title>
                </div>
            </Header>

            <Body>
                <PresetButton
                    type={'button'}
                    $variant={WIPE_PRESETS.map.variant}
                    disabled={!identity || running !== null}
                    onClick={() => wipe('map')}
                >
                    <PresetTitle>
                        <FontAwesomeIcon icon={running === 'map' ? faCircleNotch : faMap} spin={running === 'map'} />
                        {WIPE_PRESETS.map.label}
                    </PresetTitle>
                    <PresetBody>{WIPE_PRESETS.map.body}</PresetBody>
                </PresetButton>

                <PresetButton
                    type={'button'}
                    $variant={WIPE_PRESETS.bp.variant}
                    disabled={!identity || running !== null}
                    onClick={() => wipe('bp')}
                >
                    <PresetTitle>
                        <FontAwesomeIcon icon={running === 'bp' ? faCircleNotch : faScroll} spin={running === 'bp'} />
                        {WIPE_PRESETS.bp.label}
                    </PresetTitle>
                    <PresetBody>{WIPE_PRESETS.bp.body}</PresetBody>
                </PresetButton>

                <PresetButton
                    type={'button'}
                    $variant={WIPE_PRESETS.full.variant}
                    disabled={!identity || running !== null}
                    onClick={() => wipe('full')}
                >
                    <PresetTitle>
                        <FontAwesomeIcon icon={running === 'full' ? faCircleNotch : faTrashAlt} spin={running === 'full'} />
                        {WIPE_PRESETS.full.label}
                    </PresetTitle>
                    <PresetBody>{WIPE_PRESETS.full.body}</PresetBody>
                </PresetButton>
            </Body>

            <Banner>
                {identityErr
                    ? identityErr
                    : identity
                    ? `target: /server/${identity}/`
                    : 'discovering identity directory…'}
            </Banner>
        </Card>
    );
};

export default RustWipePanel;
