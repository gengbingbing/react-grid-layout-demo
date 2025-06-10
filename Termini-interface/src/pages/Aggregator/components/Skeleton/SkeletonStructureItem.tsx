import Skeleton from "react-loading-skeleton";
import cx from "classnames";
import './index.scss'

const SkeletonStructureItem = () => {
  return (
    <div className={cx("aggregator-swap-to w-full")}>
      <Skeleton className="mb-[7px]"  height={26} width={94} />
      <Skeleton height={17} width={55} />
    </div>
  )
}

export default SkeletonStructureItem;