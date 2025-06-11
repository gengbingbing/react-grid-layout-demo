import { Trans } from "@lingui/macro";
import { Suspense, lazy } from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import { isDevelopment } from "config/env";

import PageNotFound from "pages/PageNotFound/PageNotFound";
import SpotTrade from "pages/Spot/index";

import { useSettings } from "context/SettingsContext/SettingsContextProvider";


const LazyUiPage = lazy(() => import("pages/UiPage/UiPage"));
export const UiPage = () => <Suspense fallback={<Trans>Loading...</Trans>}>{<LazyUiPage />}</Suspense>;

const LazyDragLayoutDemo = lazy(() => import("components/AdvancedDragLayout/DragLayoutDemo"));
export const DragLayoutDemoPage = () => <Suspense fallback={<Trans>Loading...</Trans>}>{<LazyDragLayoutDemo />}</Suspense>;

export function MainRoutes({ openSettings }: { openSettings: () => void }) {
  const settings = useSettings();
  return (
    <Switch>
      <Route exact path="/">
        <Redirect to="/drag-demo" />
      </Route>

      <Route exact path="/test">
        <SpotTrade />
      </Route>

      <Route exact path="/drag-demo">
        <DragLayoutDemoPage />
      </Route>

      {isDevelopment() && (
        <>
          <Route exact path="/ui">
            <UiPage />
          </Route>
        </>
      )}

      <Route path="*">
        <PageNotFound />
      </Route>
    </Switch>
  );
}
