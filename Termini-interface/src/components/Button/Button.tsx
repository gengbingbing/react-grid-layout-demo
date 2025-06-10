import cx from "classnames";
import { HTMLProps, MouseEvent as ReactMouseEvent, ReactNode, RefObject, useMemo } from "react";

import ButtonLink from "./ButtonLink";

import "./Button.scss";

type ButtonProps = Omit<HTMLProps<HTMLButtonElement>, 'size'> & {
  children?: ReactNode;
  type?: "default" | "primary" | "dashed" | "text" | "link" | "ghost" | "tertiary";
  status?: "default" | "success" | "warning" | "danger" | "info";
  size?: "default" | "large" | "small";
  shape?: "default" | "round" | "circle";
  block?: boolean;
  variant?: "primary" | "primary-action" | "secondary" | "tertiary" | "link" | "ghost";
  className?: string;
  textAlign?: "center" | "left" | "right";
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: ReactMouseEvent) => void;
  to?: string;
  htmlType?: "button" | "submit" | "reset";
  imgSrc?: string;
  imgAlt?: string;
  imgClassName?: string;
  newTab?: boolean;
  showExternalLinkArrow?: boolean;
  buttonRef?: RefObject<HTMLButtonElement>;
  slim?: boolean;
  qa?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
};

export default function Button(props: ButtonProps) {
  const {
    type = "default",
    status = "default",
    size = "default",
    shape = "default",
    block = false,
    loading = false,
    icon,
    iconPosition = "left",
    htmlType = "button",
    variant,
    disabled,
    onClick,
    children,
    textAlign = "center",
    to,
    className,
    imgSrc,
    imgAlt = "",
    imgClassName = "",
    newTab,
    buttonRef,
    showExternalLinkArrow: showExternalLinkArrowOverride,
    slim,
    qa,
    ...rest
  } = props;

  // 兼容旧版本的 variant
  const buttonType = type;
  
  // 构建类名
  const classNames = cx(
    "btn",
    `btn-${buttonType}`,
    status !== "default" && `btn-${status}`,
    size !== "default" && `btn-${size}`,
    shape !== "default" && `btn-${shape}`,
    {
      "btn-block": block,
      "btn-loading": loading,
      "btn-icon": icon,
      "icon-right": iconPosition === "right",
      "slim": slim,
      [textAlign]: true
    },
    className
  );
  
  const showExternalLinkArrow = showExternalLinkArrowOverride ?? variant === "secondary";

  // 处理图片
  const img = useMemo(() => {
    if (!imgSrc) {
      return null;
    }

    return <img className={cx("btn-image", imgClassName)} src={imgSrc} alt={imgAlt} />;
  }, [imgSrc, imgAlt, imgClassName]);

  // 处理图标
  const iconElement = useMemo(() => {
    if (!icon) {
      return null;
    }

    return <span className="icon">{icon}</span>;
  }, [icon]);

  // 处理加载状态
  const loadingElement = useMemo(() => {
    if (!loading) {
      return null;
    }

    return <span className="loading-icon">Loading...</span>;
  }, [loading]);

  function handleClick(event: ReactMouseEvent) {
    if (disabled || loading || !onClick) {
      return;
    }

    if (onClick) {
      onClick(event);
    }
  }

  // 链接按钮
  if (to) {
    return (
      <ButtonLink
        className={classNames}
        to={to}
        onClick={onClick}
        newTab={newTab}
        showExternalLinkArrow={showExternalLinkArrow}
        disabled={disabled || loading}
        ref={buttonRef}
        qa={qa}
        {...rest}
      >
        {loadingElement}
        {iconPosition === "left" && iconElement}
        {img}
        {children}
        {iconPosition === "right" && iconElement}
      </ButtonLink>
    );
  }

  // 普通按钮
  return (
    <button
      data-qa={qa}
      ref={buttonRef}
      type={htmlType}
      className={classNames}
      onClick={handleClick}
      disabled={disabled || loading}
      {...rest}
    >
      {loadingElement}
      {iconPosition === "left" && iconElement}
      {img}
      {children}
      {iconPosition === "right" && iconElement}
    </button>
  );
}
