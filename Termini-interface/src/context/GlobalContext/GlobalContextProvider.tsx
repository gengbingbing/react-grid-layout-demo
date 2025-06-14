import { REDIRECT_POPUP_TIMESTAMP_KEY, TRADE_LINK_KEY } from "config/localStorage";
import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocalStorage } from "react-use";

type GlobalContextType = null | {
  tradePageVersion: number;
  setTradePageVersion: (version: number) => void;

  redirectPopupTimestamp: number | undefined;
  setRedirectPopupTimestamp: Dispatch<SetStateAction<number | undefined>>;

  notifyModalOpen: boolean;
  setNotifyModalOpen: (nextState: boolean) => void;
};

const context = createContext<GlobalContextType>(null);

const { Provider } = context;

export const GlobalStateProvider = memo(({ children }: PropsWithChildren<{}>) => {

  const [notifyModalOpen, setNotifyModalOpen] = useState(false);

  const [redirectPopupTimestamp, setRedirectPopupTimestamp] = useLocalStorage<number | undefined>(
    REDIRECT_POPUP_TIMESTAMP_KEY,
    undefined,
    {
      raw: false,
      deserializer: (val) => {
        if (!val) {
          return undefined;
        }
        const num = parseInt(val);

        if (Number.isNaN(num)) {
          return undefined;
        }

        return num;
      },
      serializer: (val) => (val ? val.toString() : ""),
    }
  );

  const value = useMemo(
    () => ({
      redirectPopupTimestamp,
      setRedirectPopupTimestamp,
      notifyModalOpen,
      setNotifyModalOpen,
    }),
    [
      redirectPopupTimestamp,
      setRedirectPopupTimestamp,
      notifyModalOpen,
      setNotifyModalOpen,
    ]
  );

  return <Provider value={value}>{children}</Provider>;
});

export const useGlobalContext = () => {
  const value = useContext(context);
  if (value === null) {
    throw new Error("useGlobalContext must be used within a GlobalContextProvider");
  }

  return value;
};
