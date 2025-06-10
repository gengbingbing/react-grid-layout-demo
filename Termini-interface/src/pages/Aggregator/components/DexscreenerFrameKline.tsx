import { isDevelopment } from "config/env";
import { ethers } from "ethers";
import { useEffect, useState, useMemo } from "react";
import { NATIVE_TOKEN } from "../config";
import "./index.scss"
import { t, Trans } from "@lingui/macro";

interface DexscreenerFrameKlineProps {
  address: string;
}

const TOKEN_ADDRESS_MAP: Record<string, string> = {
  "0x4200000000000000000000000000000000000006": "0x4200000000000000000000000000000000000006",
  "0x26e6f7c7047252DdE3dcBF26AA492e6a264Db655": "0x2CAE934a1e84F693fbb78CA5ED3B0A6893259441",
  "0x26e6f7c7047252dde3dcbf26aa492e6a264db655": "0x2CAE934a1e84F693fbb78CA5ED3B0A6893259441",
  "0x8cce37e4a9752dd313c5F842Da3e57C7a1519D92": "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
  "0xa5d6513082ef1f157a33a066293309e74a8af6df": "0xf24e57b1cb00d98C31F04f86328e22E8fcA457fb",
  "0xe14b432b82ba85d36c0b1f5dcd43605a1fd329cc": "0xc67476893C166c537afd9bc6bc87b3f228b44337",
  "0x28d4f1870c5d161b56091f3eef1783121581c4c7": "0x54e86315C03217b76A7466C302245fD10ebEf25A",
  "0x97368885747176170506A65C0096b91236b744e7": "0x3A337a6adA9d885b6Ad95ec48F9b75f197b5AE35",
  "0xe9a198d38483ad727abc8b0b1e16b2d338cf0391": "0xbA9986D2381edf1DA03B0B9c1f8b00dc4AacC369",
  "0x97368885747176170506a65c0096b91236b744e7": "0x3a337a6ada9d885b6ad95ec48f9b75f197b5ae35",
};

export default function DexscreenerFrameKline({ address }: DexscreenerFrameKlineProps) {
  const [isLoad, setIsLoad] = useState(true);
  
  const tokenAddress = useMemo(() => {
    if (!address) return '';
    return address === ethers.ZeroAddress ? NATIVE_TOKEN : address;
  }, [address]);

  const shouldShowNoData = useMemo(() => {
    return isDevelopment() && !TOKEN_ADDRESS_MAP[tokenAddress];
  }, [tokenAddress]);

  const iframeUrl = useMemo(() => {
    const mappedAddress = isDevelopment() ? TOKEN_ADDRESS_MAP[tokenAddress] : tokenAddress;
    return `https://dexscreener.com/soneium/${mappedAddress}?embed=1&theme=dark&trades=0&info=0`;
  }, [tokenAddress]);

  useEffect(() => {
    setIsLoad(true);
  }, [address]);

  if (shouldShowNoData) {
    return (
      <div className="w-full h-full overflow-hidden relative dexscreener-frame-k-line">
        <div className="absolute top-0 right-0 bg-[var(--color-bg-main)] z-20 w-full h-full rounded-[var(--borderRadius-xl)] flex justify-center items-center">
          <span className="text-[var(--color-text-tertiary)] ml-[var(--spacing-2)] homePop400">No chart data.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden relative dexscreener-frame-k-line">
      <iframe
        className="w-full h-[458px] rounded-[var(--borderRadius-xl)] border"
        src={iframeUrl}
        allow="clipboard-write"
        allowFullScreen={true}
        width="100%"
        height="100%"
        style={{position: 'relative', display: 'block', border: '0px'}}
        onLoad={() => {
          setIsLoad(false)
        }}
      ></iframe>
      {
        isLoad && (
          <div className="absolute top-0 right-0 bg-[var(--color-bg-main)] z-10 w-full h-[calc(100%-var(--spacing-9))] rounded-[var(--borderRadius-xl)] flex justify-center items-center">
            <div className="dexscreener-loading">
              <span className="loading-icon"><Trans>Loading...</Trans></span>
            </div>
            <span className="text-[var(--color-text-secondary)] ml-[var(--spacing-2)] homePop400">Loading chart settings...</span>
          </div>
        )
      }
    </div>
  );
}
