import { ReactNode } from "react";
import "./ConnectWalletButton.scss";
import Button from "components/Button";
type Props = {
  imgSrc: string;
  children: ReactNode;
  onClick: () => void;
};

export default function ConnectWalletButton({ imgSrc, children, onClick }: Props) {
  return (
    <Button onClick={onClick}>
      {imgSrc && <img className="btn-icon" src={imgSrc} alt="Connect Wallet" />}
      <span className="btn-label ml-6">{children}</span>
    </Button>
    // <button data-qa="connect-wallet-button" className="connect-wallet-btn" onClick={onClick}>
    //   {imgSrc && <img className="btn-icon" src={imgSrc} alt="Connect Wallet" />}
    //   <span className="btn-label">{children}</span>
    // </button>
  );
}
