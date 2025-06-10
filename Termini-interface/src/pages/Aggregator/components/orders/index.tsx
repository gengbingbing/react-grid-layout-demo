import "./index.scss";
import cx from "classnames";
import { t, Trans } from "@lingui/macro";
import Tooltip from "components/Tooltip/Tooltip";
import OpenOrder from "./OpenOrder";
import OrderHistory from "./OrderHistory";
import OpenDcaOrder from "./OpenDcaOrder";
import DcaOrderHistory from "./DcaOrderHistory";
// 这里需要导入DCA相关组件
// import OpenDcaOrder from "./OpenDcaOrder";
// import DcaOrderHistory from "./DcaOrderHistory";

export default function OrderList(props) {
  const { 
    tokenMap, 
    tradeTranTypeTab, 
    setTradeTranTypeTab, 
    orderActiveTab, 
    setOrderActiveTab, 
    loading, 
    orders: orderOpenData, 
    setPendingTxns, 
    hasNewOrder, 
    setHasNewOrder,
    DcaOrders,
    DcaLoading,
    limitOrderLength,
    dcaOrderLength
  } = props;

  return (
    <div className="tactics-list">
      <div className="h-[53px] flex items-center px-[var(--spacing-3)] gap-[var(--spacing-2)]">
        <div
          className={cx(
            "tactics-tab text-[var(--color-text-tertiary)] homePop500 flex items-center justify-center py-[22px] cursor-pointer",
            { "active-list-tab": orderActiveTab === "limit" }
          )}
          onClick={() => setOrderActiveTab("limit")}
        >
          <Trans>Limit</Trans> {limitOrderLength && tradeTranTypeTab === "openOrders" ? `(${limitOrderLength})` : ""}
        </div>
        <div
          className={cx(
            "tactics-tab text-[var(--color-text-tertiary)] homePop500 flex items-center justify-center py-[22px] cursor-pointer",
            { "active-list-tab": orderActiveTab === "dca" }
          )}
          onClick={() => setOrderActiveTab("dca")}
        >
          <Trans>DCA</Trans> {dcaOrderLength && tradeTranTypeTab === "openOrders" ? `(${dcaOrderLength})` : ""}
        </div>
      </div>
      <div className="h-[1px] w-full bg-[var(--color-border)]"></div>
      <div className="table-list">
        {
          tradeTranTypeTab === "openOrders" && orderActiveTab === "limit" && (
            <OpenOrder
              tokenMap={tokenMap}
              tradeTranTypeTab={tradeTranTypeTab}
              setTradeTranTypeTab={setTradeTranTypeTab}
              orders={orderOpenData}
              loading={loading}
              setPendingTxns={setPendingTxns}
              hasNewOrder={hasNewOrder}
              setHasNewOrder={setHasNewOrder}
            />
          )
        }
        {
          tradeTranTypeTab === "openOrders" && orderActiveTab === "dca" && (
            <OpenDcaOrder
              tokenMap={tokenMap}
              tradeTranTypeTab={tradeTranTypeTab}
              setTradeTranTypeTab={setTradeTranTypeTab}
              orders={DcaOrders}
              loading={DcaLoading}
              setPendingTxns={setPendingTxns}
              hasNewOrder={hasNewOrder}
              setHasNewOrder={setHasNewOrder}
            />
          )
        }
        {
          tradeTranTypeTab === "orderHistory" && orderActiveTab === "limit" && (
            <OrderHistory
              tokenMap={tokenMap}
              tradeTranTypeTab={tradeTranTypeTab}
            />
          )
        }
        {
          tradeTranTypeTab === "orderHistory" && orderActiveTab === "dca" && (
            <DcaOrderHistory
              tokenMap={tokenMap}
              tradeTranTypeTab={tradeTranTypeTab}
              setTradeTranTypeTab={setTradeTranTypeTab}
              orders={DcaOrders}
              loading={DcaLoading}
              setPendingTxns={setPendingTxns}
              hasNewOrder={hasNewOrder}
              setHasNewOrder={setHasNewOrder}
            />
          )
        }
      </div>
    </div>
  );
}
