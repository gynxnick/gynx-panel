import React from 'react';
import { NavLink, Route, Switch } from 'react-router-dom';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import SubNavigation from '@/components/elements/SubNavigation';
import { useLocation } from 'react-router';
import Spinner from '@/components/elements/Spinner';
import routes from '@/routers/routes';
import AppShell from '@/components/gynx/AppShell';
import TopBar from '@/components/gynx/TopBar';

export default () => {
    const location = useLocation();
    const inAccount = location.pathname.startsWith('/account');

    const header = inAccount
        ? <TopBar.Dashboard eyebrow="you" title="account" />
        : <TopBar.Dashboard eyebrow="workspace" title="your servers" />;

    const tabs = inAccount ? (
        <SubNavigation>
            <div>
                {routes.account
                    .filter((route) => !!route.name)
                    .map(({ path, name, exact = false }) => (
                        <NavLink key={path} to={`/account/${path}`.replace('//', '/')} exact={exact}>
                            {name}
                        </NavLink>
                    ))}
            </div>
        </SubNavigation>
    ) : undefined;

    return (
        <AppShell header={header} tabs={tabs}>
            <TransitionRouter>
                <React.Suspense fallback={<Spinner centered />}>
                    <Switch location={location}>
                        <Route path={'/'} exact>
                            <DashboardContainer />
                        </Route>
                        {routes.account.map(({ path, component: Component }) => (
                            <Route key={path} path={`/account/${path}`.replace('//', '/')} exact>
                                <Component />
                            </Route>
                        ))}
                        <Route path={'*'}>
                            <NotFound />
                        </Route>
                    </Switch>
                </React.Suspense>
            </TransitionRouter>
        </AppShell>
    );
};
