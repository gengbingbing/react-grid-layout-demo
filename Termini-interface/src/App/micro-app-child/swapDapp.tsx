import jsxCustomEvent from "@micro-zoe/micro-app/polyfill/jsx-custom-event";
import { useEffect, useMemo, useState } from "react";
import microApp from "@micro-zoe/micro-app";
import { useLocation } from "react-router-dom";

const SwapDapp = () => {
  const location = useLocation();
  const [microAppData, changeMicroAppData] = useState({ msg: "来自基座的数据" });

  function handleCreate() {
    console.log("child-SwapDapp 创建了");
  }

  function handleBeforeMount() {
    console.log("child-SwapDapp 即将被渲染");
  }

  function handleMount() {
    console.log("child-SwapDapp 已经渲染完成");

    setTimeout(() => {
      changeMicroAppData({ msg: "来自基座的新数据" });
    }, 2000);
  }

  function handleUnmount() {
    console.log("child-SwapDapp 卸载了");
  }

  function handleError() {
    console.log("child-SwapDapp 加载出错了");
  }

  function handleDataChange(e: CustomEvent) {
    console.log("来自子应用 child-SwapDapp 的数据:", e.detail.data);
  }

  const curLocation = useMemo(() => location.pathname.replace("/swapDapp", ""), [location.pathname]);

  console.log(curLocation, "============curLocation=============");

  useEffect(() => {
    microApp.setData("swapDapp", {
      path: curLocation,
    });
  }, [curLocation]);

  return (
    <div>
      <micro-app
        name="swapDapp"
        url={`http://localhost:33100/`}
        data={microAppData}
        onCreated={handleCreate}
        onBeforemount={handleBeforeMount}
        onMounted={handleMount}
        onUnmount={handleUnmount}
        onError={handleError}
        onDataChange={handleDataChange}
      ></micro-app>
    </div>
  );
};

export default SwapDapp;
