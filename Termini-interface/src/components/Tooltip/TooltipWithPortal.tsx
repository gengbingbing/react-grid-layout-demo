import React, { MouseEvent, useCallback, useRef, useState } from "react";
import cx from "classnames";

import "./Tooltip.scss";
import { IS_TOUCH } from "config/env";
import Portal from "../Common/Portal";
import { TooltipPosition } from "./Tooltip";

const OPEN_DELAY = 0;
const CLOSE_DELAY = 100;

type Props = {
  handle: React.ReactNode;
  renderContent: () => React.ReactNode;
  position?: TooltipPosition;
  trigger?: string;
  className?: string;
  portalClassName?: string;
  disableHandleStyle?: boolean;
  handleClassName?: string;
  isHandlerDisabled?: boolean;
  fitHandleWidth?: boolean;
  closeOnDoubleClick?: boolean;
  isInsideModal?: boolean;
  shouldStopPropagation?: boolean;
};

type Coords = {
  height?: number;
  width?: number;
  left?: number;
  top?: number;
};

export default function TooltipWithPortal(props: Props) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<Coords>({});
  const [tooltipWidth, setTooltipWidth] = useState<string>();
  const intervalCloseRef = useRef<ReturnType<typeof setTimeout> | null>();
  const intervalOpenRef = useRef<ReturnType<typeof setTimeout> | null>();

  const position = props.position ?? "right-bottom";
  const trigger = props.trigger ?? "hover";
  const handlerRef = useRef<null | HTMLInputElement>(null);

  const updateTooltipCoords = useCallback(() => {
    const rect = handlerRef?.current?.getBoundingClientRect();

    if (rect) {
      setCoords({
        height: rect.height,
        width: rect.width,
        left: rect.x,
        top: rect.y + window.scrollY,
      });
      if (props.fitHandleWidth) {
        setTooltipWidth(`${rect.width}px`);
      }
    }
  }, [handlerRef, props.fitHandleWidth]);

  const onMouseEnter = useCallback(() => {
    if (trigger !== "hover" || IS_TOUCH) return;

    if (intervalCloseRef.current) {
      clearInterval(intervalCloseRef.current);
      intervalCloseRef.current = null;
    }
    if (!intervalOpenRef.current) {
      intervalOpenRef.current = setTimeout(() => {
        setVisible(true);
        intervalOpenRef.current = null;
      }, OPEN_DELAY);
    }
    updateTooltipCoords();
  }, [setVisible, intervalCloseRef, intervalOpenRef, trigger, updateTooltipCoords]);

  const onMouseClick = useCallback(
    (event: MouseEvent) => {
      if (props.shouldStopPropagation) {
        event.stopPropagation();
      }
      if (trigger !== "click" && !IS_TOUCH) return;
      if (intervalCloseRef.current) {
        clearInterval(intervalCloseRef.current);
        intervalCloseRef.current = null;
      }
      if (intervalOpenRef.current) {
        clearInterval(intervalOpenRef.current);
        intervalOpenRef.current = null;
      }
      updateTooltipCoords();

      if (props.closeOnDoubleClick) {
        setVisible((old) => !old);
      } else {
        setVisible(true);
      }
    },
    [props.closeOnDoubleClick, props.shouldStopPropagation, trigger, updateTooltipCoords]
  );

  const onMouseLeave = useCallback(() => {
    intervalCloseRef.current = setTimeout(() => {
      setVisible(false);
      intervalCloseRef.current = null;
    }, CLOSE_DELAY);
    if (intervalOpenRef.current) {
      clearInterval(intervalOpenRef.current);
      intervalOpenRef.current = null;
    }
    updateTooltipCoords();
  }, [setVisible, intervalCloseRef, updateTooltipCoords]);

  const onHandleClick = useCallback((event: MouseEvent) => {
    event.preventDefault();
  }, []);

  const className = cx("Tooltip", props.className);

  return (
    <span className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onMouseClick}>
      <span
        className={cx({ "Tooltip-handle": !props.disableHandleStyle }, [props.handleClassName], { active: visible })}
        onClick={onHandleClick}
        ref={handlerRef}
      >
        {/* For onMouseLeave to work on disabled button https://github.com/react-component/tooltip/issues/18#issuecomment-411476678 */}
        {props.isHandlerDisabled ? <div className="Tooltip-disabled-wrapper">{props.handle}</div> : <>{props.handle}</>}
      </span>
      {visible && coords.left && (
        <Portal>
          <div style={{ ...coords, position: "absolute" }} className={props.portalClassName}>
            <div className={cx(["Tooltip-popup z-index-1001", position])} style={{ width: tooltipWidth }}>
              {props.renderContent()}
            </div>
          </div>
        </Portal>
      )}
    </span>
  );
}
