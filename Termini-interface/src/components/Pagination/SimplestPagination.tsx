import cx from "classnames";

import Button from "components/Button/Button";

import "./Pagination.css";

export type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  topMargin?: boolean;
};

export default function SimplestPagination({ page, pageCount, topMargin = true, onPageChange }: PaginationProps) {
  if (pageCount <= 1) {
    return <></>;
  }

  return (
    <div
      className={cx("simplest-pagination")}
    >
      <div className="pagination-buttons">
        <Button variant="secondary" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          {"<"}
        </Button>
        <Button variant="secondary" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
          {">"}
        </Button>
      </div>
    </div>
  );
}
