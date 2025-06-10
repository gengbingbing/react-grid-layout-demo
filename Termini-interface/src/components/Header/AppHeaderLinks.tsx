import { t, Trans } from "@lingui/macro";
import { useState } from "react";
import { FiX } from "react-icons/fi";
import { Link, useHistory } from "react-router-dom";
import MenuHeader from "./MenuHeader";
import { isHomeSite } from "lib/legacy";
import { useNotifyModalState } from "lib/useNotifyModalState";
import logoImg from "img/logo/logo.svg";
import { HeaderLink } from "./HeaderLink";
import { FaChevronDown } from "react-icons/fa";
import "./Header.scss";
import { useLanguageModal } from "hooks/useLanguageModal";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { useTheme } from 'context/ThemeContext';
import { getChainData } from "config/constants";
import { useChainId } from "lib/chains";

type Props = {
  small?: boolean;
  clickCloseIcon?: () => void;
  openSettings?: () => void;
  showRedirectModal: (to: string) => void;
};

type MenuItem = {
  title: any;
  to: string;
  disabled: boolean;
  openInNewTab?: boolean;
  key: string;
};

export function AppHeaderLinks({ small, openSettings, clickCloseIcon, showRedirectModal }: Props) {
  const { openNotifyModal } = useNotifyModalState();
  const history = useHistory();
  const { chainId } = useChainId();

  const DOCS_URL = getChainData(chainId).DOCS_URL

  const {
    openLanguageModal,
    LanguageModal
  } = useLanguageModal();
  const { themeMode, toggleTheme } = useTheme();
  const [isDarkThemeHovered, setIsDarkThemeHovered] = useState(false);
  const [isLightThemeHovered, setIsLightThemeHovered] = useState(false);
  const poolMenuItems: MenuItem[] = [
    { title: <Trans>Perp Pools</Trans>, to: "/addSPLPLiquidity", disabled: true, key: "Perp Pools" },
    { title: <Trans>Swap Pools</Trans>, to: "/liquidity", disabled: true, key: "Swap Pools" },
    { title: <Trans>Farms</Trans>, to: "/farm", disabled: true, key: "Farms" },
  ];
  const launchItems: MenuItem[] = [
    { title: <Trans>Launching</Trans>, to: "/memeLaunch", disabled: true, key: "Launching" },
    { title: <Trans>Leaderboard</Trans>, to: "/memeLeaderBoard", disabled: true, key: "Leaderboard" },
  ];
  const dashboardItems: MenuItem[] = [
    { title: <Trans>Trades</Trans>, to: "/tradeDashboard", disabled: true, key: "Trades" },
    { title: <Trans>Pools</Trans>, to: "/poolsDashboard", disabled: true, key: "Pools" },
    { title: <Trans>Referrals</Trans>, to: "/referrals", disabled: true, key: "Referrals" },
    { title: <Trans>Points</Trans>, to: "/pointsDashboard", disabled: true, key: "Points" },
    { title: <Trans>Meme</Trans>, to: "/memeDashboard", disabled: true, key: "Meme" },
  ];
  const moreItems: MenuItem[] = [
    { title: <Trans>Stats</Trans>, to: "/stats", disabled: true, key: "Stats" },
    { title: <Trans>Docs</Trans>, to: DOCS_URL, disabled: false, openInNewTab: true, key: "Docs" },
    { title: <Trans>Audit</Trans>, to: `${DOCS_URL}/fundamentals/security`, disabled: false, openInNewTab: true, key: "Audit" },
    { title: <Trans>Bridge</Trans>, to: `https://superbridge.app/soneium`, disabled: false, openInNewTab: true, key: "Bridge" },
  ];

  const menus = [
    { title: <Trans>Trade</Trans>, items: [], to: '/trade', disabled: false, key: "Trade" },
    { title: <Trans>Earn</Trans>, items: [], to: '/earn', disabled: false, key: "Earn" },
    // { title: <Trans>Perp</Trans>, items: [], to: '/Perp', disabled: true, key: "Perp" },
    // { title: <Trans>Pools</Trans>, items: poolMenuItems, key: "Pools" },
    // { title: <Trans>Launch</Trans>, items: launchItems, key: "Launch" },
    // { title: <Trans>Dashboard</Trans>, items: dashboardItems, key: "Dashboard" },
    // { title: <Trans>More</Trans>, items: moreItems, key: "More" }
  ];

  const [isMenuOpen, setIsMenuOpen] = useState<{ [key: string]: boolean }>({
    Pools: false,
    Launch: false,
    Dashboard: false,
    More: false,
  });

  const toggleMenu = (menuTitle: string) => {
    setIsMenuOpen((prev) => ({ ...prev, [menuTitle]: !prev[menuTitle] }));
  };

  return (
    <div className="App-header-links">
      {small && (
        <>
          <div className="App-header-links-header">
            <Link className="App-header-link-main" to="/">
              <img src={logoImg} alt="Termini Logo" />
            </Link>
            <div
              className="App-header-menu-icon-block max-w-[450px]:mr-12 mr-8 !border-0"
              onClick={() => clickCloseIcon && clickCloseIcon()}
            >
              <FiX className="App-header-menu-icon" />
            </div>
          </div>
          <div className="flex flex-col">
            {menus.map((menu) => (
              <div key={menu.key} className="App-header-dropdown">
                {menu.items.length > 0 ? (
                  <>
                    <a
                      className="App-header-dropdown-toggle"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(menu.key);
                      }}
                    >
                      {menu.title}
                      <FaChevronDown
                        style={{ transform: isMenuOpen[menu.key] ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                        className="menuIcon ml-[6px] mt-2 text-[12px] font-medium"
                      />
                    </a>
                    {isMenuOpen[menu.key] && (
                      <div className="App-header-dropdown-menu">
                        {menu.items.map((item:any) => (
                          <div key={item.qa} className="App-header-link-container !justify-start" style={{ position: "relative" }}>
                            <HeaderLink
                              qa={item.qa}
                              to={item.to}
                              disabled={item.disabled}
                              openInNewTab={item.openInNewTab}
                              showRedirectModal={showRedirectModal}
                            >
                              {item.label}
                            </HeaderLink>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="App-header-link-container">
                    <HeaderLink
                      qa={menu.key.toLowerCase()}
                      to={`/${menu.key.toLowerCase()}`}
                      showRedirectModal={showRedirectModal}
                    >
                      {menu.title}
                    </HeaderLink>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {!small && (
        <>
          {menus.map((menu) => (
            <div key={menu.key} className="App-header-link-container">
              {menu.items.length > 0 ? (
                <MenuHeader label={menu.title} items={menu.items} showRedirectModal={showRedirectModal} />
              ) : (
                <HeaderLink
                  qa={menu.key.toLowerCase()}
                  to={menu.to || ''}
                  showRedirectModal={showRedirectModal}
                  disabled={menu.disabled}
                >
                  {menu.title}
                </HeaderLink>
              )}
            </div>
          ))}
        </>
      )}
      {small && !isHomeSite() && (
        <>
          <div className="App-header-link-container">
            {/* eslint-disable-next-line */}
            <a href="#" data-qa="settings" onClick={openSettings}>
              <Trans>Settings</Trans>
            </a>
            <a
              href="#"
              data-qa="Language"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openLanguageModal();
              }}
            >
              <Trans>Language</Trans>
            </a>
            <div className="px-[var(--spacing-6)]">
              <div className="settingBox !flex !w-[66px] cursor-pointer flexRow itemsCenter">
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
            </div>

          </div>
        </>

      )}
      <LanguageModal />
    </div>
  );
}