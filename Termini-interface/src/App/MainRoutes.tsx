import { Trans } from "@lingui/macro";
import { Suspense, lazy } from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import { isDevelopment } from "config/env";

import PageNotFound from "pages/PageNotFound/PageNotFound";
import SwapDapp from '../App/micro-app-child/swapDapp'

import Aggregator from "pages/Aggregator/index";
import { useSettings } from "context/SettingsContext/SettingsContextProvider";


const LazyUiPage = lazy(() => import("pages/UiPage/UiPage"));
// const SwapDapp = lazy(() => import(/* webpackChunkName: "react18" */ '../App/micro-app-child/swapDapp'))
export const UiPage = () => <Suspense fallback={<Trans>Loading...</Trans>}>{<LazyUiPage />}</Suspense>;

export function MainRoutes({ openSettings }: { openSettings: () => void }) {
  const settings = useSettings();
  return (
    <Switch>
      <Route exact path="/">
        <Redirect to="/trade" />
      </Route>
      <Route exact path="/trade">
        <Aggregator openSettings={openSettings} />
      </Route>
      <Route exact path="/trade/:tokenA/:tokenB">
        <Aggregator openSettings={openSettings} />
      </Route>

      {isDevelopment() && (
        <>
          <Route exact path="/ui">
            <UiPage />
          </Route>
          <Route path="/swapDapp/*">
            <SwapDapp />
          </Route>
        </>
      )}

      <Route path="*">
        <PageNotFound />
      </Route>
    </Switch>
  );
}
