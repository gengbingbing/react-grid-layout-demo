import { Menu } from "@headlessui/react";
import { t,Trans } from "@lingui/macro";
import { HeaderLink } from "./HeaderLink";
import { useLocation } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";

type DropdownMenuProps = {
    label: any;
    items: Array<{
        title: any;
        to: string;
        disabled?: boolean;
        openInNewTab?: boolean
        key:string
    }>;
    showRedirectModal: (to: string) => void;
};

export default function DropdownMenu({ label, items, showRedirectModal }: DropdownMenuProps) {
    const location = useLocation();
    const isActive = items.some(item => location.pathname.includes(item.to));

    return (
        <div className="menuHeader">
            <Menu as="div" className="relative inline-block text-left">
                {({ open }) => (<>
                    <Menu.Button className={`App-menu-header-link ${isActive ? "active" : ""}`}>
                        <div className="flex items-center">
                            {label}
                            <FaChevronDown className={`ml-3 mt-1 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`} size={12} />
                        </div>
                    </Menu.Button>
                    <Menu.Items className="menu-items network-dropdown-items absolute" style={{ left: 0 }}>
                        <div className="py-1">
                            {items.map((item) => (
                                <Menu.Item key={item.to}>
                                    {({ active }) => (
                                        <HeaderLink
                                            qa={item.key}
                                            to={item.to}
                                            disabled={item.disabled || false}
                                            showRedirectModal={showRedirectModal}
                                            openInNewTab={item.openInNewTab || false}
                                            className={`${active ? "bg-hover" : ""
                                                } flex justify-between w-full px-4 py-2 text-sm leading-5 text-left`}
                                            style={{
                                                backgroundColor: active ? "var(--color-hover)" : undefined
                                            }}
                                        >
                                            {item.title}
                                        </HeaderLink>
                                    )}
                                </Menu.Item>
                            ))}
                        </div>
                    </Menu.Items>
                </>)}
            </Menu>
        </div>
    );
}