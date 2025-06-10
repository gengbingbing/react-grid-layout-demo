import { useSpotTrendsTokenList } from "pages/Aggregator/useSpotData";
import TrendCard from "./TrendCard";
import { useChainId } from "lib/chains";
import { t, Trans } from "@lingui/macro";

export default function TrendingList(props) {
  const { handleCurrencySelect } = props;

  const { chainId } = useChainId();
  const {data: trendsTokenList, loading, init } = useSpotTrendsTokenList(chainId);

  return (
    <div className="Trending-list flex flex-wrap gap-[7px] max-h-[55rem] overflow-y-auto">
      {
        trendsTokenList?.length ? trendsTokenList.map((item: any, index: number) => {
          return <TrendCard key={index} item={item} handleCurrencySelect={handleCurrencySelect} />
        }) : !trendsTokenList?.length && loading ? (
          <div className="mt-[80px] pb-[60px] text-[#7c7c7c] w-full flex justify-center items-center"><Trans>loading...</Trans></div>
        ) : (
          <div className="mt-[80px] pb-[60px] text-[#7c7c7c] w-full flex justify-center items-center"><Trans>No data here.</Trans></div>
        )
      }
    </div>
  );
}