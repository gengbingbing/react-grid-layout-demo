import { t } from "@lingui/macro";
import cx from "classnames";
import React, { useCallback, useState } from "react";
import { useMedia } from "react-use";

import CrossIconComponent from "img/cross.svg?react";
import SearchIconComponent from "img/search.svg?react";
import { useOutsideClick } from "lib/useOutsideClick";

type Props = {
  value: string;
  setValue: (value: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  className?: string;
  placeholder?: string;
  size?: "s" | "m";
  /**
   * If not provided, will be set to false on small screens
   */
  autoFocus?: boolean;
  qa?: string;
};

export default function SearchInput({
  value,
  setValue,
  onKeyDown,
  className,
  placeholder,
  autoFocus,
  size = "m",
  qa = "token-search-input",
}: Props) {
  const isSmallerScreen = useMedia("(max-width: 700px)");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, [setIsFocused]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, [setIsFocused]);

  useOutsideClick(containerRef, handleBlur);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
    [setValue]
  );

  const handleClear = useCallback(() => {
    setValue("");
    inputRef.current?.focus();
  }, [setValue]);

  const handleClick = useCallback(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  return (
    <div className={cx("relative flex cursor-pointer items-center p-0 ", className)} ref={containerRef}>
      <div className="absolute top-0 flex h-full items-center px-12">
        <SearchIconComponent
          height={16}
          width={16}
          onClick={handleClick}
          style={{
            position: "relative",
            top: "-1px",
            color: isFocused ? "var(--color-text-primary)" : "var(--color-text-secondary)"
          }}
        />
      </div>
      <input
        ref={inputRef}
        data-qa={qa}
        type="text"
        placeholder={placeholder ?? t`Search Token`}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        onFocus={handleFocus}
        autoFocus={autoFocus ?? !isSmallerScreen}
        className={cx("search-input block w-full rounded-4 border placeholder-text-secondary", {
          "border-primary": isFocused,
          "border-border": !isFocused,
          "py-10 pl-40 pr-34": size === "m",
          "py-[8.5px] pl-34 pr-30": size === "s",
        })}
        style={{
          fontSize: size === "m" ? "var(--fontSize-base)" : "var(--fontSize-sm)",
          borderRadius: "var(--borderRadius-sm)",
          paddingTop: size === "m" ? "var(--spacing-3)" : "var(--spacing-2)",
          paddingBottom: size === "m" ? "var(--spacing-3)" : "var(--spacing-2)",
          paddingLeft: size === "m" ? "var(--spacing-10)" : "var(--spacing-8)",
          paddingRight: size === "m" ? "var(--spacing-8)" : "var(--spacing-7)",
        }}
      />
      {value && (
        <button
          className={cx("group absolute bottom-0 right-0 top-0 flex items-center", {
            "pr-8": size === "m",
            "pr-4": size === "s",
          })}
          onClick={handleClear}
        >
          <div
            className="rounded-4 p-4 hover:bg-[--color-hover] hover:text-[--color-text-secondary] active:bg-[var(--color-active)] active:text-[var(--color-text-secondary)]"
            style={{
              color: "var(--color-text-secondary)"
            }}
          >
            <CrossIconComponent
              className="w-16"
              style={{
                color: isFocused ? "var(--color-text-primary)" : "var(--color-text-secondary)"
              }}
            />
          </div>
        </button>
      )}
    </div>
  );
}
