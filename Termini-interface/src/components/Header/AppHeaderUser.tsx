import { Trans, t } from "@lingui/macro";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState, useCallback } from "react";
import { GrLanguage } from "react-icons/gr";
import { MINATO_MAINNET, MINATO_TESTNET, getChainName } from "config/chains";
import { isDevelopment } from "config/env";
import { getIcon } from "config/icons";
import connectWalletImg from "img/ic_wallet_24.svg";
import { useChainId } from "lib/chains";
import { getAccountUrl, isHomeSite } from "lib/legacy";
import useWallet from "lib/wallets/useWallet";

import AddressDropdown from "../AddressDropdown/AddressDropdown";
import ConnectWalletButton from "../Common/ConnectWalletButton";
import LanguagePopupHome from "../NetworkDropdown/LanguagePopupHome";
import NetworkDropdown from "./NetworkDropdown";
import { RiSettings4Fill } from "react-icons/ri";

import "./Header.scss";
import { getChainData } from "config/constants";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { useTheme } from 'context/ThemeContext';
import { useLanguageModal } from "hooks/useLanguageModal";

type Props = {
  openSettings: () => void;
  small?: boolean;
  disconnectAccountAndCloseSettings: () => void;
  showRedirectModal: (to: string) => void;
  menuToggle?: React.ReactNode;
};

const NETWORK_OPTIONS = [
  {
    label: getChainName(MINATO_MAINNET),
    value: MINATO_MAINNET,
    icon: getIcon(MINATO_MAINNET, "network"),
    color: "#E841424D",
  }
];

if (isDevelopment()) {
  NETWORK_OPTIONS.push({
    label: getChainName(MINATO_TESTNET),
    value: MINATO_TESTNET,
    icon: getIcon(MINATO_TESTNET, "network"),
    color: "#E841424D",
  });
}

export function AppHeaderUser({
  small,
  menuToggle,
  openSettings,
  disconnectAccountAndCloseSettings,
  showRedirectModal,
}: Props) {
  const { account, active } = useWallet();
  const { openConnectModal } = useConnectModal();
  const showConnectionOptions = !isHomeSite();
  const { chainId } = useChainId();
  const selectorLabel = getChainName(chainId);
  
  const { 
    openLanguageModal,
    isLanguageHovered, 
    handleMouseEnter,
    handleMouseLeave,
    LanguageModal
  } = useLanguageModal();
  
  // 保留其他状态
  const [isSettingsHovered, setIsSettingsHovered] = useState(false);
  const [isDarkThemeHovered, setIsDarkThemeHovered] = useState(false);
  const [isLightThemeHovered, setIsLightThemeHovered] = useState(false);

  // 使用主题上下文
  const { themeMode, toggleTheme } = useTheme();

  if (!active || !account) {
    return (
      <div className="App-header-user">
        {showConnectionOptions && openConnectModal ? (
          <>
            <NetworkDropdown
              networkOptions={NETWORK_OPTIONS}
            />
            <ConnectWalletButton
              onClick={() => {
                openConnectModal();
              }}
              imgSrc={connectWalletImg}
            >
              {small ? <Trans>Connect</Trans> : <Trans>Connect Wallet</Trans>}
            </ConnectWalletButton>

            <div
              className="settingBox cursor-pointer"
              onClick={openSettings}
              onMouseEnter={() => setIsSettingsHovered(true)}
              onMouseLeave={() => setIsSettingsHovered(false)}
            >
              <RiSettings4Fill
                size={23}
                style={{
                  color: isSettingsHovered
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-tertiary)'
                }}
              />
            </div>
            <div className="settingBox !w-[66px] cursor-pointer flexRow itemsCenter">
              <div
                className={`themeIcon mr2 ${themeMode === 'dark' ? 'active' : ''}`}
                onClick={() => toggleTheme('dark')}
                onMouseEnter={() => setIsDarkThemeHovered(true)}
                onMouseLeave={() => setIsDarkThemeHovered(false)}
              >
                <MdDarkMode
                  size={20}
                  style={{
                    color: themeMode === 'dark' || isDarkThemeHovered
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-tertiary)'
                  }}
                />
              </div>
              <div
                className={`themeIcon ${themeMode === 'light' ? 'active' : ''}`}
                onClick={() => toggleTheme('light')}
                onMouseEnter={() => setIsLightThemeHovered(true)}
                onMouseLeave={() => setIsLightThemeHovered(false)}
              >
                <MdLightMode
                  size={20}
                  style={{
                    color: themeMode === 'light' || isLightThemeHovered
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-tertiary)'
                  }}
                />
              </div>
            </div>
            <div
              className="settingBox cursor-pointer"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={(e) => {
                // 阻止事件冒泡，防止触发父组件的点击事件
                e.stopPropagation();
                openLanguageModal()
              }}
            >
              <GrLanguage
                size={20}
                style={{
                  color: isLanguageHovered
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-tertiary)'
                }}
              />
            </div>
            <LanguageModal />
          </>
        ) : (
          <LanguagePopupHome />
        )}
        {menuToggle}
      </div>
    );
  }

  const accountUrl = getAccountUrl(chainId, account);

  const mediaInfo = getChainData(chainId);

  return (
    <div className="App-header-user">
      {showConnectionOptions ? (
        <>
          <NetworkDropdown
            networkOptions={NETWORK_OPTIONS}
          />
          <div data-qa="user-address" className="App-header-user-address">
            <AddressDropdown
              account={account}
              accountUrl={accountUrl}
              disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
            />
          </div>
          <div className="settingBox !w-[66px] cursor-pointer flexRow itemsCenter">
            <div
              className={`themeIcon mr2 ${themeMode === 'dark' ? 'active' : ''}`}
              onClick={() => toggleTheme('dark')}
              onMouseEnter={() => setIsDarkThemeHovered(true)}
              onMouseLeave={() => setIsDarkThemeHovered(false)}
            >
              <MdDarkMode
                size={20}
                style={{
                  color: themeMode === 'dark' || isDarkThemeHovered
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-tertiary)'
                }}
              />
            </div>
            <div
              className={`themeIcon ${themeMode === 'light' ? 'active' : ''}`}
              onClick={() => toggleTheme('light')}
              onMouseEnter={() => setIsLightThemeHovered(true)}
              onMouseLeave={() => setIsLightThemeHovered(false)}
            >
              <MdLightMode
                size={20}
                style={{
                  color: themeMode === 'light' || isLightThemeHovered
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-tertiary)'
                }}
              />
            </div>
          </div>
          <div
            className="settingBox cursor-pointer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => {
              // 阻止事件冒泡，防止触发父组件的点击事件
              e.stopPropagation();
              openLanguageModal()
            }}
          >
            <GrLanguage
              size={20}
              style={{
                color: isLanguageHovered
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-tertiary)'
              }}
            />
          </div>
          <LanguageModal />
        </>
      ) : (
        <LanguagePopupHome />
      )}
      {menuToggle}
    </div>
  );
}
