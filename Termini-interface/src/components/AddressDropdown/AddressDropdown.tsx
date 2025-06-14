import { Menu } from "@headlessui/react";
import { Trans, t } from "@lingui/macro";
import { FaChevronDown } from "react-icons/fa";
import { createBreakpoint, useCopyToClipboard } from "react-use";

import { helperToast } from "lib/helperToast";
import { useENS } from "lib/legacy";
import { shortenAddressOrEns } from "lib/wallets";

import ExternalLink from "components/ExternalLink/ExternalLink";

import copy from "img/ic_copy_20.svg";
import externalLink from "img/ic_new_link_20.svg";
import disconnect from "img/ic_sign_out_20.svg";

import { Avatar } from "components/Avatar/Avatar";
import "./AddressDropdown.scss";

type Props = {
  account: string;
  accountUrl: string;
  disconnectAccountAndCloseSettings: () => void;
};

const useBreakpoint = createBreakpoint({ L: 600, M: 550, S: 400 });

function AddressDropdown({ account, accountUrl, disconnectAccountAndCloseSettings }: Props) {
  const breakpoint = useBreakpoint();
  const [, copyToClipboard] = useCopyToClipboard();
  const { ensName } = useENS(account);
  const displayAddressLength = breakpoint === "S" ? 9 : 13;

  return (
    <Menu>
      <Menu.Button as="div" className="flex items-center">
        <button className="small transparent address-btn px-[var(--spacing-2)]">
          <div className="user-avatar">
            <Avatar size={20} ensName={ensName} address={account} />
          </div>
          <span className="user-address">{shortenAddressOrEns(ensName || account, displayAddressLength)}</span>
          <FaChevronDown size={12} style={{color: 'var(--color-text-secondary)'}} />
        </button>
      </Menu.Button>
      <div>
        <Menu.Items as="div" className="menu-items">
          <Menu.Item>
            <div
              className="menu-item"
              onClick={() => {
                copyToClipboard(account);
                helperToast.success(t`Address copied to your clipboard`);
              }}
            >
              <img width={20} className="size-20" src={copy} alt="Copy user address" />
              <p>
                <Trans>Copy Address</Trans>
              </p>
            </div>
          </Menu.Item>
          <Menu.Item>
            <ExternalLink href={accountUrl} className="menu-item">
              <img width={20} className="size-20" src={externalLink} alt="Open address in explorer" />
              <p>
                <Trans>View in Explorer</Trans>
              </p>
            </ExternalLink>
          </Menu.Item>
          <Menu.Item>
            <div
              className="menu-item"
              onClick={() => {
                disconnectAccountAndCloseSettings();
              }}
            >
              <img width={20} className="size-20" src={disconnect} alt="Disconnect the wallet" />
              <p>
                <Trans>Disconnect</Trans>
              </p>
            </div>
          </Menu.Item>
        </Menu.Items>
      </div>
    </Menu>
  );
}

export default AddressDropdown;
