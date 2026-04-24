import TransferListener from '@/components/server/TransferListener';
import React, { useEffect, useState } from 'react';
import { NavLink, Route, Switch, useRouteMatch } from 'react-router-dom';
import TransitionRouter from '@/TransitionRouter';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import { ServerContext } from '@/state/server';
import { CSSTransition } from 'react-transition-group';
import Can from '@/components/elements/Can';
import Spinner from '@/components/elements/Spinner';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import { useStoreState } from 'easy-peasy';
import SubNavigation from '@/components/elements/SubNavigation';
import InstallListener from '@/components/server/InstallListener';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import PermissionRoute from '@/components/elements/PermissionRoute';
import routes, { ServerNavGroup } from '@/routers/routes';
import AppShell from '@/components/gynx/AppShell';
import TopBar from '@/components/gynx/TopBar';

const GROUP_ORDER: ServerNavGroup[] = ['management', 'monitoring', 'config'];
const GROUP_LABELS: Record<ServerNavGroup, string> = {
    management: 'manage',
    monitoring: 'monitor',
    config:     'config',
};

export default () => {
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();

    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [error, setError] = useState('');

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);

    const to = (value: string, url = false) => {
        if (value === '/') {
            return url ? match.url : match.path;
        }
        return `${(url ? match.url : match.path).replace(/\/*$/, '')}/${value.replace(/^\/+/, '')}`;
    };

    useEffect(
        () => () => {
            clearServerState();
        },
        []
    );

    useEffect(() => {
        setError('');

        getServer(match.params.id).catch((error) => {
            console.error(error);
            setError(httpErrorToHuman(error));
        });

        return () => {
            clearServerState();
        };
    }, [match.params.id]);

    // Server-not-yet-loaded state: render shell with a spinner in content slot.
    if (!uuid || !id) {
        return (
            <AppShell>
                {error ? <ServerError message={error} /> : <Spinner size={'large'} centered />}
            </AppShell>
        );
    }

    // Build the grouped tab strip. Ungrouped / legacy-named routes fall into
    // a trailing 'ungrouped' bucket so nothing disappears if someone forgets
    // to tag a new route.
    const grouped: Record<string, typeof routes.server> = {};
    for (const route of routes.server) {
        if (!route.name) continue;
        const key = route.group || 'ungrouped';
        (grouped[key] = grouped[key] || []).push(route);
    }

    const renderTab = (route: typeof routes.server[number]) => {
        const content = (
            <NavLink key={route.path} to={to(route.path, true)} exact={route.exact}>
                {route.icon && <FontAwesomeIcon icon={route.icon} className={'mr-2 text-[11px] opacity-80'} />}
                {route.name}
            </NavLink>
        );
        return route.permission ? (
            <Can key={route.path} action={route.permission} matchAny>
                {content}
            </Can>
        ) : content;
    };

    const tabs = (
        <CSSTransition timeout={150} classNames={'fade'} appear in>
            <SubNavigation>
                <div>
                    {GROUP_ORDER.map((group, idx) => {
                        const items = grouped[group];
                        if (!items || items.length === 0) return null;
                        return (
                            <React.Fragment key={group}>
                                {idx > 0 && (
                                    <span
                                        className={'inline-block mx-3 my-auto'}
                                        style={{
                                            width: 1,
                                            height: 18,
                                            background: 'rgba(255, 255, 255, 0.08)',
                                        }}
                                        aria-hidden
                                    />
                                )}
                                <span
                                    className={'gynx-eyebrow mr-2 hidden lg:inline-block'}
                                    aria-label={`${group} group`}
                                >
                                    {GROUP_LABELS[group]}
                                </span>
                                {items.map(renderTab)}
                            </React.Fragment>
                        );
                    })}
                    {grouped.ungrouped?.map(renderTab)}
                    {rootAdmin && (
                        // eslint-disable-next-line react/jsx-no-target-blank
                        <a href={`/admin/servers/view/${serverId}`} target={'_blank'}>
                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                        </a>
                    )}
                </div>
            </SubNavigation>
        </CSSTransition>
    );

    return (
        <AppShell header={<TopBar.Server />} tabs={tabs}>
            <InstallListener />
            <TransferListener />
            <WebsocketHandler />
            {inConflictState && (!rootAdmin || (rootAdmin && !location.pathname.endsWith(`/server/${id}`))) ? (
                <ConflictStateRenderer />
            ) : (
                <ErrorBoundary>
                    <TransitionRouter>
                        <Switch location={location}>
                            {routes.server.map(({ path, permission, component: Component }) => (
                                <PermissionRoute key={path} permission={permission} path={to(path)} exact>
                                    <Spinner.Suspense>
                                        <Component />
                                    </Spinner.Suspense>
                                </PermissionRoute>
                            ))}
                            <Route path={'*'} component={NotFound} />
                        </Switch>
                    </TransitionRouter>
                </ErrorBoundary>
            )}
        </AppShell>
    );
};
