import { t, Trans } from "@lingui/macro";
import { useCallback, useEffect, useState } from "react";
import { useKey } from "react-use";

import { BASIS_POINTS_DIVISOR, DEFAULT_SLIPPAGE_AMOUNT } from "config/factors";
import { useSettings } from "context/SettingsContext/SettingsContextProvider";
import { useChainId } from "lib/chains";
import { helperToast } from "lib/helperToast";
import { roundToTwoDecimals } from "lib/numbers";

import { AlertInfo } from "components/AlertInfo/AlertInfo";
import Button from "components/Button/Button";
import { SlideModal } from "components/Modal/SlideModal";
import NumberInput from "components/NumberInput/NumberInput";

const defaultSippageDisplay = (DEFAULT_SLIPPAGE_AMOUNT / BASIS_POINTS_DIVISOR) * 100;

export function AggregatorSettingsModal({
  isSettingsVisible,
  setIsSettingsVisible,
}: {
  isSettingsVisible: boolean;
  setIsSettingsVisible: (value: boolean) => void;
}) {
  const settings = useSettings();
  const { chainId } = useChainId();

  const [slippageAmount, setSlippageAmount] = useState<string>("0");
  const [deadline, setDeadline] = useState<string>('3600');

  useEffect(() => {
    if (!isSettingsVisible) return;

    const slippage = parseInt(String(settings.savedAggregatorAllowedSlippage));
    const deadlineData = parseInt(String(settings.saveAggregatorDeadline));
    setSlippageAmount(String(roundToTwoDecimals((slippage / BASIS_POINTS_DIVISOR) * 100)));
    setDeadline(String(deadlineData))
  }, [isSettingsVisible]);

  const saveAndCloseSettings = useCallback(() => {
    const slippage = parseFloat(String(slippageAmount));
    const deadlineData = parseFloat(String(deadline));
    if (isNaN(slippage)) {
      helperToast.error(t`Invalid slippage value`);
      return;
    }
    if (isNaN(deadlineData)) {
      helperToast.error(t`Invalid slippage value`);
      return;
    }
    if (slippage > 49) {
      helperToast.error(t`Slippage should be less than -5%`);
      return;
    }
    const basisPoints = roundToTwoDecimals((slippage * BASIS_POINTS_DIVISOR) / 100);
    if (parseInt(String(basisPoints)) !== parseFloat(String(basisPoints))) {
      helperToast.error(t`Max slippage precision is -0.01%`);
      return;
    }

    settings.setSavedAggregatorAllowedSlippage(basisPoints);
    settings.setSaveAggregatorDeadline(deadlineData)

    setIsSettingsVisible(false);
  }, [
    slippageAmount,
    settings,
    setIsSettingsVisible,
  ]);

  useKey(
    "Enter",
    () => {
      if (isSettingsVisible) {
        saveAndCloseSettings();
      }
    },
    {},
    [isSettingsVisible, saveAndCloseSettings]
  );

  return (
    <SlideModal
      isVisible={isSettingsVisible}
      setIsVisible={setIsSettingsVisible}
      label={t`Aggregator Settings`}
      qa="settings-modal"
      className="text-body-medium"
      desktopContentClassName="w-[380px]"
    >
      <div className="mb-8">
        <div>
          <Trans>Allowed Slippage</Trans>
        </div>
        <div className="relative">
          <NumberInput
            className="mb-8 mt-8 w-full rounded-4"
            style={{
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "var(--color-border)"
            }}
            value={slippageAmount}
            onValueChange={(e) => setSlippageAmount(e.target.value)}
            placeholder={defaultSippageDisplay.toString()}
          />

          <div className="absolute right-11 top-1/2 -translate-y-1/2 text-right" style={{ color: "var(--color-text-secondary)" }}>%</div>
        </div>
        {parseFloat(slippageAmount) < defaultSippageDisplay && (
          <AlertInfo type="warning">
            <Trans>Allowed Slippage below {defaultSippageDisplay}% may result in failed orders.</Trans>
          </AlertInfo>
        )}
      </div>
      <div className="mb-8">
        <div>
          <Trans>Transaction deadline</Trans>
        </div>
        <div className="relative">
          <NumberInput
            className="mb-8 mt-8 w-full rounded-4"
            style={{
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "var(--color-border)"
            }}
            value={deadline}
            onValueChange={(e) => setDeadline(e.target.value)}
            placeholder={defaultSippageDisplay.toString()}
          />

          <div className="absolute right-11 top-1/2 -translate-y-1/2 text-right" style={{ color: "var(--color-text-secondary)" }}>sec</div>
        </div>
      </div>

      <Button type="primary" variant="primary-action" className="mt-15 w-full" onClick={saveAndCloseSettings}>
        <Trans>Save</Trans>
      </Button>
    </SlideModal>
  );
}
