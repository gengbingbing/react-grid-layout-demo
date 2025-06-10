import "./BuyInputSection.scss";
import React, { useRef, ReactNode, ChangeEvent, useState, useCallback } from "react";
import cx from "classnames";
import { Trans } from "@lingui/macro";
import { PERCENTAGE_SUGGESTIONS } from "config/ui";
import NumberInput from "components/NumberInput/NumberInput";

type Props = {
  topLeftLabel: string;
  bottomLeftValue?: string;
  isBottomLeftValueMuted?: boolean;
  bottomRightLabel?: string;
  bottomRightValue?: string;
  onClickBottomRightLabel?: () => void;
  topRightLabel?: string;
  topRightValue?: string;
  onClickTopRightLabel?: () => void;
  inputValue?: number | string;
  onInputValueChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  // eslint-disable-next-line react/no-unused-prop-types
  maxButtonPosition?: "bottom-right" | "top-right";
  onClickMax?: () => void;
  onFocus?: () => void;
  // eslint-disable-next-line react/no-unused-prop-types
  shouldClosestLabelTriggerMax?: boolean;
  children?: ReactNode;
  showPercentSelector?: boolean;
  onPercentChange?: (percentage: number) => void;
  qa?: string;
};

function getMaxButtonPosition({
  maxButtonPosition: maybeMaxButtonPosition,
  onClickMax,
  shouldClosestLabelTriggerMax = true,
  topRightLabel,
  topRightValue,
  bottomRightLabel,
  bottomRightValue,
}: Props) {
  let maxPosition = "bottom-right";
  if (maybeMaxButtonPosition) {
    maxPosition = maybeMaxButtonPosition;
  } else if (onClickMax && shouldClosestLabelTriggerMax) {
    if (topRightLabel || topRightValue) {
      maxPosition = "top-right";
    } else if (bottomRightLabel || bottomRightValue) {
      maxPosition = "bottom-right";
    }
  }
  return maxPosition;
}

export default function BuyInputSection(props: Props) {
  const {
    topLeftLabel,
    bottomLeftValue,
    isBottomLeftValueMuted = false,
    bottomRightLabel,
    bottomRightValue,
    onClickBottomRightLabel,
    topRightLabel,
    topRightValue,
    onClickTopRightLabel,
    inputValue,
    onInputValueChange,
    onClickMax,
    onFocus,
    children,
    showPercentSelector,
    onPercentChange,
    qa,
  } = props;
  const [isPercentSelectorVisible, setIsPercentSelectorVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const maxButtonPosition = getMaxButtonPosition(props);

  const handleOnFocus = useCallback(() => {
    if (showPercentSelector && onPercentChange) {
      setIsPercentSelectorVisible(true);
    }
    if (onFocus) onFocus();
  }, [showPercentSelector, onPercentChange, setIsPercentSelectorVisible, onFocus]);

  const handleOnBlur = useCallback(() => {
    if (showPercentSelector && onPercentChange) {
      setIsPercentSelectorVisible(false);
    }
  }, [showPercentSelector, onPercentChange, setIsPercentSelectorVisible]);

  const handleBoxClick = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const onUserInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onInputValueChange) {
        onInputValueChange(e);
      }
    },
    [onInputValueChange]
  );

  const handleMaxClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
      if (onClickMax) {
        e.stopPropagation();
        onClickMax();
      }
    },
    [onClickMax]
  );

  const handleTopRightClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (onClickTopRightLabel) {
        e.stopPropagation();
        onClickTopRightLabel();
      } else if (onClickMax && maxButtonPosition === "top-right") {
        e.stopPropagation();
        onClickMax();
      }
    },
    [onClickTopRightLabel, onClickMax, maxButtonPosition]
  );

  const handleBottomRightClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (onClickBottomRightLabel) {
        e.stopPropagation();
        onClickBottomRightLabel();
      } else if (onClickMax && maxButtonPosition === "bottom-right") {
        e.stopPropagation();
        onClickMax();
      }
    },
    [onClickBottomRightLabel, onClickMax, maxButtonPosition]
  );

  return (
    <div data-qa={qa}>
      <div
        className="flex cursor-text flex-col justify-between gap-8 rounded-4 px-14 pb-16 pt-12 text-12 leading-[16px] shadow-[inset_0_0_0_1px] shadow-[transparent] focus-within:shadow-cold-blue-500 hover:[&:not(:focus-within)]:shadow-[rgba(58,63,121,0.4)]"
        style={{
          backgroundColor: "var(--color-bg-sub)"
        }}
        onClick={handleBoxClick}
      >
        <div className="flex justify-between">
          <div data-label="left" style={{ color: "var(--color-text-primary)" }}>
            {topLeftLabel}
          </div>
          {(topRightLabel || topRightValue || (onClickMax && maxButtonPosition === "top-right")) && (
            <div
              data-label="right"
              className={cx(
                "flex items-baseline gap-4",
                (onClickTopRightLabel || (onClickMax && maxButtonPosition === "top-right")) && "cursor-pointer"
              )}
              onClick={handleTopRightClick}
            >
              {topRightLabel && <span style={{ color: "var(--color-text-primary)" }}>{topRightLabel}:</span>}
              {topRightValue && <span>{topRightValue}</span>}
              {onClickMax && maxButtonPosition === "top-right" && (
                <button
                  type="default"
                  className="-my-4 rounded-4 px-8 py-2"
                  style={{
                    backgroundColor: "var(--color-primary)",
                  }}
                  onClick={handleMaxClick}
                  data-qa="input-max"
                >
                  <Trans>MAX</Trans>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="relative grow">
            <NumberInput
              value={inputValue}
              className="h-28 w-full min-w-0 p-0 text-24 !leading-[24px] outline-none"
              inputRef={inputRef}
              onValueChange={onUserInput}
              onFocus={handleOnFocus}
              onBlur={handleOnBlur}
              placeholder="0.0"
              qa={qa ? qa + "-input" : undefined}
            />
            <div 
              className="absolute right-0 top-0 h-full w-8" 
              style={{ 
                background: `linear-gradient(to right, rgba(0,0,0,0), var(--color-bg-sub))` 
              }} 
            />

            {showPercentSelector && isPercentSelectorVisible && onPercentChange && (
              <ul className="PercentSelector">
                {PERCENTAGE_SUGGESTIONS.map((percentage) => (
                  <li
                    className="PercentSelector-item"
                    key={percentage}
                    onMouseDown={() => {
                      onPercentChange?.(percentage);
                      handleOnBlur();
                    }}
                    data-qa={`${qa}-percent-selector-${percentage}`}
                  >
                    {percentage}%
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="shrink-0 text-24 leading-[24px]">{children}</div>
        </div>

        {(bottomLeftValue || bottomRightValue || (onClickMax && maxButtonPosition === "bottom-right")) && (
          <div className="flex justify-between">
            <div
              style={{
                color: isBottomLeftValueMuted ? "var(--color-text-tertiary)" : "var(--color-text-primary)"
              }}
            >
              {bottomLeftValue || ""}
            </div>
            <div
              className={cx(
                "flex items-baseline gap-4",
                (onClickBottomRightLabel || (onClickMax && maxButtonPosition === "bottom-right")) && "cursor-pointer"
              )}
              onClick={handleBottomRightClick}
            >
              {bottomRightLabel && <span style={{ color: "var(--color-text-primary)" }}>{bottomRightLabel}:</span>}
              {bottomRightValue && <span>{bottomRightValue}</span>}

              {onClickMax && maxButtonPosition === "bottom-right" && (
                <button
                  type="default"
                  className="-my-4 rounded-4 px-8 py-2"
                  style={{
                    backgroundColor: "var(--color-primary)",
                  }}
                  onClick={handleMaxClick}
                  data-qa="input-max"
                >
                  <Trans>MAX</Trans>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
