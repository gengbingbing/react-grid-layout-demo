import { memo } from "react";
import { Trans, t } from "@lingui/macro";

import Modal from "../Modal/Modal";
import Button from "../Button/Button";
import { useNotifyModalState } from "lib/useNotifyModalState";
import ExternalLink from "components/ExternalLink/ExternalLink";

import "./NotifyModal.scss";

import NotifiLogoIcon from "img/notifi-logo.svg?react";
import ArrowBulletIcon from "img/arrow-bullet.svg?react";
import ExternalLinkIcon from "img/external-link.svg?react";

export function NotifyModal() {
  const { notifyModalOpen, setNotifyModalOpen } = useNotifyModalState();

  return (
    <Modal isVisible={notifyModalOpen} setIsVisible={setNotifyModalOpen} label={t`Termini Notify`}>
      <div className="NotifyModal">
        <p className="text-body-medium mb-[2rem]">
          <Trans>
            Get notify from Termini to stay on top of your trades, liquidation risk, and&nbsp;more.
          </Trans>
        </p>
        <Button
          variant="primary-action"
          to="/"
          newTab
          className="NotifyModal-button w-full"
          type="default"
        >
          <Trans>Discover Termini Alerts</Trans>
          <ExternalLinkIcon />
        </Button>
      </div>
    </Modal>
  );
}

