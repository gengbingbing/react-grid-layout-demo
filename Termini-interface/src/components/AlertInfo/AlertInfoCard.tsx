import { ReactNode, useCallback, useState } from "react";
import cx from "classnames";

import InfoIconComponent from "img/ic_info.svg?react";
import WarnIconComponent from "img/ic_warn.svg?react";
import { MdClose } from "react-icons/md";

type Props = {
  /**
   * @default "info"
   */
  type?: "warning" | "info";
  children: ReactNode;
  className?: string;
  onClose?: () => void;
};

export function AlertInfoCard({ children, type = "info", onClose, className }: Props) {
  const [closed, setClosed] = useState(false);
  const Icon = type === "warning" ? WarnIconComponent : InfoIconComponent;

  const handleClose = useCallback(() => {
    setClosed(true);
  }, []);

  if (closed) {
    return null;
  }

  return (
    <div
      className={cx(
        "flex rounded-4 border-l-2 px-8 py-8",
        className
      )}
      style={{
        fontSize: "var(--fontSize-sm)",
        borderColor: type === "info" ? "var(--color-text-primary)" : "var(--color-web3-yellow)",
        backgroundColor: type === "info" ? "var(--color-bg-sub)" : "var(--color-web3-yellow-10)",
        color: type === "info" ? "var(--color-text-primary)" : "var(--color-web3-yellow)"
      }}
      onClick={onClose}
    >
      <div className="pr-5 pt-2">
        <Icon aria-label="Alert Icon" className="block size-12" fontSize={12} />
      </div>
      <div className="grow">{children}</div>

      {onClose && (
        <MdClose 
          fontSize={16} 
          className="ml-4 shrink-0 cursor-pointer" 
          style={{ color: "var(--color-text-primary)" }}
          onClick={handleClose} 
        />
      )}
    </div>
  );
}
