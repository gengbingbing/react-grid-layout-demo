import { Menu } from "@headlessui/react";
import { FaChevronDown } from "react-icons/fa";
import { useChainId } from "lib/chains";
import { switchNetwork } from "lib/wallets";
import useWallet from "lib/wallets/useWallet";

type NetworkOption = {
  label: string;
  value: number;
  icon: string;
  color?: string;
};

type NetworkDropdownProps = {
  networkOptions: NetworkOption[];
  maxVisibleNetworks?: number;
};

export default function NetworkDropdown({ 
  networkOptions, 
  maxVisibleNetworks = 4 
}: NetworkDropdownProps) {
  const { chainId } = useChainId();
  const { active } = useWallet();
  
  // 显示在主界面的网络（最多maxVisibleNetworks个）
  const visibleNetworks = networkOptions.slice(0, maxVisibleNetworks);
  // 是否有更多网络需要在下拉菜单中显示
  const hasMoreNetworks = networkOptions.length > maxVisibleNetworks;
  // 下拉菜单中显示的网络
  const dropdownNetworks = hasMoreNetworks ? networkOptions.slice(maxVisibleNetworks) : [];
  
  // 处理网络切换
  const handleNetworkChange = async (networkId: number) => {
    try {
      await switchNetwork(networkId, active);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  return (
    <div className="App-header-network-selector">
      <div className="network-icons-container">
        {visibleNetworks.map(network => (
          <div
            key={network.value}
            className={`network-icon ${chainId === network.value ? 'active' : ''}`}
            onClick={() => handleNetworkChange(network.value)}
            title={network.label}
          >
            <img src={network.icon} alt={network.label} width="23" height="23" />
          </div>
        ))}

        {hasMoreNetworks && (
          <Menu as="div" className="network-more-dropdown">
            <Menu.Button className="network-more-icon">
              <FaChevronDown size={12} style={{ color: 'var(--color-text-secondary)' }} />
            </Menu.Button>
            <Menu.Items className="menu-items network-dropdown-items p-[var(--spacing-2)]">
              {dropdownNetworks.map(network => (
                <Menu.Item key={network.value}>
                  {({ active: menuActive }) => (
                    <div
                      className={`network-dropdown-menu-item menu-item !justify-start ${chainId === network.value ? 'active' : ''} ${menuActive ? 'hover' : ''}`}
                      onClick={() => handleNetworkChange(network.value)}
                    >
                      <img src={network.icon} alt={network.label} width="20" height="20" />
                      <span className="ml-[var(--spacing-2)]">{network.label}</span>
                    </div>
                  )}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Menu>
        )}
      </div>
    </div>
  );
}