import "./index.scss";
import cx from "classnames";
import { Trans } from "@lingui/macro";
import SearchInput from "components/SearchInput/SearchInput";
import { formatDecimalWithSubscript, formatNumberKM } from "pages/Aggregator/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SortIcon } from "../icon";
import { useChainId } from "lib/chains";
import { useSpotTokenList } from "pages/Aggregator/useSpotData";
import { debounce } from "lodash";
import SimplestPagination from "components/Pagination/SimplestPagination";

export default function TokenListTable(props) {
  const { type, handleCurrencySelect } = props;
  const { chainId } = useChainId();
  const [orderType, setOrderType] = useState<string>("");
  const [sortType, setSortType] = useState<any>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    onInputChange(searchKeyword);
  }, [searchKeyword]);
  const onInputChange = useCallback(
    debounce((value) => {
      setKeyword(value);
    }, 1000),
    []
  );

  const sortClick = (type: string) => {
    if (orderType === type) {
      setSortType(sortType === "asc" ? "desc" : "asc");
    } else {
      setOrderType(type);
      setSortType("desc");
    }
    setCurrentPage(1);
  };

  const params = {
    tag: type === "Meme" ? "meme" : "all",
    pageNum: currentPage,
    pageSize,
    orderType,
    sortType,
    keyword,
  };

  const { data: tokenList, count, loading, init } = useSpotTokenList(type, chainId, params);
  const [filterTokenData, setFilterTokenData] = useState(tokenList);

  const pageCount = Math.ceil(count / 10);

  useEffect(() => {
    setOrderType("");
    setSortType("");
    setSearchKeyword("");
    setCurrentPage(1);
    if(type === "Favorites") {
      setPageSize(100) 
    } else {
      setPageSize(10) 
    }
  }, [type]);

  useEffect(() => {
    if (type === "Favorites") {
      const locFavToken = JSON.parse(localStorage.getItem(`aggregator-swap-fav-token-${chainId}`) || "[]");
      const favList = tokenList.filter((item: any) => {
        if (locFavToken.includes(item?.address?.toLowerCase())) {
          return true;
        }
      });
      setFilterTokenData(favList);
    } else {
      setFilterTokenData(tokenList);
    }
  }, [type, tokenList]);
  
  return (
    <div className="token-list-table">
      <div className={cx("table-wrapper relative", {
        "pb-[46px]": type !== "Favorites" && pageCount > 0
      })}>
        <table className="token--table">
          <thead>
            <tr>
              <th className="table-head w-[22rem]" scope="col">
                { type === "Favorites" ? 'Token' : (
                  <SearchInput
                    autoFocus={false}
                    className="table-search-token h-[28px] rounded-[4px] w-[80%] max-md:w-full"
                    placeholder="Search..."
                    size="s"
                    value={searchKeyword}
                    setValue={setSearchKeyword}
                  />
                ) }
              </th>
              <th className="table-head w-[11rem]" scope="col">
                <Trans>Price</Trans>
              </th>
              <th className="table-head w-[11rem]" scope="col">
                <div className="flex gap-[4px] items-center cursor-pointer max-md:w-[6rem]" onClick={() => sortClick("changeRate")}>
                  <span style={{ color: orderType === "changeRate" ? "var(--color-text-primary)" : "var(--color-text-disable)" }}>24h</span>
                  { type !== "Favorites" && <SortIcon sortType={orderType === "changeRate" ? sortType : "none"} /> }
                </div>
              </th>
              <th className="table-head w-[13rem]" scope="col">
                <div
                  className="flex gap-[4px] items-center cursor-pointer"
                  onClick={() => sortClick("totalLiquidityUSD")}
                >
                  <span style={{ color: orderType === "totalLiquidityUSD" ? "var(--color-text-primary)" : "var(--color-text-disable)" }}><Trans>Total Liquidity</Trans></span>
                  { type !== "Favorites" && <SortIcon sortType={orderType === "totalLiquidityUSD" ? sortType : "none"} /> }
                </div>
              </th>
              <th className="table-head w-[11rem]" scope="col">
                <div className="flex gap-[4px] items-center cursor-pointer" onClick={() => sortClick("marketCapUSD")}>
                  <span style={{ color: orderType === "marketCapUSD" ? "var(--color-text-primary)" : "var(--color-text-disable)" }}>MCAP</span>
                  { type !== "Favorites" && <SortIcon sortType={orderType === "marketCapUSD" ? sortType : "none"} /> }
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filterTokenData.map((tokenItem: any, index: number) => {
              const { logoURI, symbol, priceUSD, changeRate, totalLiquidityUSD, marketCapUSD } = tokenItem;
              return (
                <tr className="text-[var(--fontSize-sm)] cursor-pointer hover:bg-[var(--color-hover)]" key={index} onClick={() => handleCurrencySelect(tokenItem, "to")}>
                  <td className="text-[var(--color-text-secondary)]" data-label="Token Info">
                    <div className="flex items-center gap-[9px] max-md:w-[12rem]">
                      <img src={logoURI} alt={symbol} className="w-[28px] h-[28px] rounded-full" />
                      <div>{symbol}</div>
                    </div>
                  </td>
                  <td className="text-[var(--color-text-secondary)]" data-label="Price">
                    {Number(priceUSD) === 0 ? '--' : Number(priceUSD) < 0.0001 ? `$${formatDecimalWithSubscript(Number(priceUSD))}` : `$${Number(priceUSD).toFixed(4)}`}
                  </td>
                  <td className="text-[var(--color-text-secondary)]" data-label="24h Change">
                    {Number(changeRate) === 0 ? '--' : Number(changeRate) > 0 ? (
                      <span className="text-[var(--color-web3-green)]">+{Number(changeRate).toFixed(2)}%</span>
                    ) : (
                      <span className="text-[var(--color-web3-red)]">{Number(changeRate).toFixed(2)}%</span>
                    )}
                  </td>
                  <td className="text-[var(--color-text-secondary)]" data-label="Total Liquidity">
                    {
                      Number(totalLiquidityUSD) === 0 ? '--' : `$${formatNumberKM(Number(totalLiquidityUSD))}`
                    }
                  </td>
                  <td className="text-[var(--color-text-secondary)]" data-label="MCAP">
                    {
                      Number(marketCapUSD) === 0 ? '--' : `$${formatNumberKM(Number(marketCapUSD))}`
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filterTokenData?.length && loading &&
          <div className='mt-[80px] pb-[60px] text-[var(--color-text-tertiary)] text-center w-full'><Trans>loading...</Trans></div>
        }
        {!filterTokenData?.length && !loading &&
          <div className='mt-[80px] pb-[60px] text-[var(--color-text-tertiary)] text-center w-full'><Trans>No data here.</Trans></div>
        }
        {
          type !== "Favorites" && (
            <div className="token-list-pagination absolute flex justify-center items-center bottom-0 w-full h-[5rem]">
              <SimplestPagination pageCount={pageCount} page={currentPage} onPageChange={(page) => setCurrentPage(page)} />
            </div>
          )
        }
      </div>
    </div>
  );
}