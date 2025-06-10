import cx from "classnames";

import {
  TokenFavoriteKey,
  tokensFavoritesTabOptionLabels,
  tokensFavoritesTabOptions,
  useTokensFavorites,
} from "context/TokensFavoritesContext/TokensFavoritesContextProvider";
import { useLocalizedMap } from "lib/i18n";

import Button from "components/Button/Button";

export function FavoriteTabs({ favoritesKey }: { favoritesKey: TokenFavoriteKey }) {
  const { tab, setTab } = useTokensFavorites(favoritesKey);

  const localizedTabOptionLabels = useLocalizedMap(tokensFavoritesTabOptionLabels);

  return (
    <div className="flex items-center gap-4 whitespace-nowrap">
      {tokensFavoritesTabOptions.map((option) => (
        <Button
          key={option}
          type="default"
          variant={"ghost"}
          className={cx("!text-body-medium !py-7", {
            "!bg-primary": tab === option,
          })}
          style={{
            backgroundColor: tab === option ? "var(--color-primary)" : undefined
          }}
          onClick={() => setTab(option)}
          data-selected={tab === option}
        >
          {localizedTabOptionLabels[option]}
        </Button>
      ))}
    </div>
  );
}
