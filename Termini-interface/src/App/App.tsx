import "@wagmi/connectors";

import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { useEffect } from "react";
import { HashRouter as Router } from "react-router-dom";
// import { BrowserRouter as Router } from "react-router-dom";
import { SWRConfig } from "swr";

import "react-toastify/dist/ReactToastify.css";
import "styles/Font.css";
import "styles/Input.css";
import "styles/Shared.scss";
import "styles/recharts.css";
import "./App.scss";

import SEO from "components/Common/SEO";
import { MINATO_MAINNET } from 'config/chains'

import { LANGUAGE_LOCALSTORAGE_KEY } from "config/localStorage";
import { GlobalStateProvider } from "context/GlobalContext/GlobalContextProvider";
import { useChainId } from "lib/chains";
import { defaultLocale, dynamicActivate } from "lib/i18n";
import { RainbowKitProviderWrapper } from "lib/wallets/WalletProvider";
import { AppRoutes } from "./AppRoutes";
import { SWRConfigProp } from "./swrConfig";

import { PendingTxnsContextProvider } from "context/PendingTxnsContext/PendingTxnsContext";
import { SettingsContextProvider } from "context/SettingsContext/SettingsContextProvider";
import { TokensBalancesContextProvider } from "context/TokensBalancesContext/TokensBalancesContextProvider";
import { ThemeProvider, useTheme } from "context/ThemeContext";
import { themes } from 'config/theme'

// @ts-ignore
if (window?.ethereum?.autoRefreshOnNetworkChange) {
  // @ts-ignore
  window.ethereum.autoRefreshOnNetworkChange = false;
}

// 创建一个内部组件来使用 useTheme 钩子
function AppWithTheme() {
  const { chainId } = useChainId();
  const { themeMode } = useTheme();
  
  useEffect(() => {
    const themeColor = themes[chainId] || themes[MINATO_MAINNET]; // 使用默认主题
    const themeCommon = themes.common;
    
    // 根据当前主题模式选择对应的颜色方案
    let colorScheme = themeColor;
    if (themeColor[themeMode]) {
      colorScheme = themeColor[themeMode];
    }
    
    const theme = Object.assign({}, colorScheme, themeCommon);
    
    const setCSSVariables = (obj, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object') {
          setCSSVariables(value, `${prefix}${key}-`);
        } else {
          //@ts-ignore
          document.documentElement.style.setProperty(`--${prefix}${key}`, value);
        }
      });
    };

    setCSSVariables(theme);
    
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [chainId, themeMode]);

  let app = <AppRoutes />;
  app = <TokensBalancesContextProvider>{app}</TokensBalancesContextProvider>;
  app = <SEO>{app}</SEO>;
  app = <RainbowKitProviderWrapper>{app}</RainbowKitProviderWrapper>;
  app = <I18nProvider i18n={i18n as any}>{app}</I18nProvider>;
  app = <PendingTxnsContextProvider>{app}</PendingTxnsContextProvider>;
  app = <SettingsContextProvider>{app}</SettingsContextProvider>;
  app = (
    <SWRConfig key={chainId} value={SWRConfigProp}>
      {app}
    </SWRConfig>
  );
  app = <GlobalStateProvider>{app}</GlobalStateProvider>;
  
  return app;
}

function App() {
  useEffect(() => {
    const defaultLanguage = localStorage.getItem(LANGUAGE_LOCALSTORAGE_KEY) || defaultLocale;
    dynamicActivate(defaultLanguage);
  }, []);

  return (
    <Router>
      <ThemeProvider>
        <AppWithTheme />
      </ThemeProvider>
    </Router>
  );
}

export default App;
