import cx from "classnames";
import { getAppBaseUrl } from "lib/legacy";
import { MouseEventHandler, ReactNode } from "react";
import { NavLink, NavLinkProps } from "react-router-dom";

import { TrackingLink } from "components/TrackingLink/TrackingLink";
import { isHomeSite, shouldShowRedirectModal } from "lib/legacy";
import { useRedirectPopupTimestamp } from "lib/useRedirectPopupTimestamp";
import "./Header.scss";

type Props = {
  isHomeLink?: boolean;
  className?: string;
  exact?: boolean;
  to: string;
  showRedirectModal: (to: string) => void;
  onClick?: MouseEventHandler<HTMLDivElement | HTMLAnchorElement>;
  children?: ReactNode;
  isActive?: NavLinkProps["isActive"];
  qa?: string;
  disabled?: boolean;
  style?:any;
  openInNewTab?: boolean
};

export function HeaderLink({
  isHomeLink,
  className,
  exact,
  to,
  children,
  style,
  showRedirectModal,
  onClick,
  openInNewTab = false,
  disabled = false,
  isActive,
  qa,
}: Props) {
  const isOnHomePage = window.location.pathname === "/";
  const isHome = isHomeSite();
  const [redirectPopupTimestamp] = useRedirectPopupTimestamp();
  const handleClick: MouseEventHandler<HTMLDivElement | HTMLAnchorElement> = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };
  const linkClassName = cx(className, { active: isHomeLink, "disabled-link": disabled });
  if (isHome && !(isHomeLink && !isOnHomePage)) {
    if (shouldShowRedirectModal(redirectPopupTimestamp)) {
      return (
        <div
          className={linkClassName}
          onClick={handleClick}
          title={disabled ? "coming soon" : undefined}
        >
          {children}
        </div>
      );
    } else {
      const baseUrl = getAppBaseUrl();

      const LinkComponent = (
        <a
          className={linkClassName}
          href={disabled ? undefined : baseUrl + to}
          onClick={handleClick}
          title={disabled ? "coming soon" : undefined}
        >
          {children}
        </a>
      );

      return onClick ? <TrackingLink onClick={handleClick}>{LinkComponent}</TrackingLink> : LinkComponent;
    }
  }

  if (openInNewTab) {
    return (
      <a href={to} target='_blank' rel='noopener'>
        {children}
      </a>
    );
  }
  return (
    <NavLink
      isActive={isActive}
      activeClassName="active"
      className={linkClassName}
      exact={exact}
      style={style}
      to={disabled ? '' : to} // 禁用时不设置 to
      onClick={handleClick}
      data-qa={qa}
      title={disabled ? "coming soon" : undefined} // 鼠标悬浮提示
    >
      {children}
    </NavLink>
  );
}
