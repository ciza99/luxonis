import { ReactNode, useMemo } from "react";
import clsx from "clsx";

export const Pagination = ({
  page,
  totalPages,
  range = 3,
  onClick,
}: {
  page: number;
  totalPages: number;
  range?: number;
  onClick?: (page: number) => void;
}) => {
  const from = Math.max(1, page - range);
  const to = Math.min(totalPages, page + range);

  const pages = new Set([
    1,
    ...Array.from({ length: to - from + 1 }, (_, i) => i + from),
    totalPages,
  ]);

  const PageItem = useMemo(
    () => pageItemFacotry(page, onClick),
    [page, onClick]
  );

  return (
    <ul className="flex">
      {[...pages].map((pageNumber) => {
        if (pageNumber === 1 && page - range > 2) {
          const leftDotsPageNumber = Math.ceil((page - range + 1) / 2);
          return (
            <>
              <PageItem key={pageNumber} page={pageNumber}>
                {pageNumber}
              </PageItem>
              <PageItem key={leftDotsPageNumber} page={leftDotsPageNumber}>
                ...
              </PageItem>
            </>
          );
        }

        if (pageNumber === totalPages && page + range < totalPages - 1) {
          const rightDotsPageNumber = Math.floor(
            (page + range + totalPages) / 2
          );
          return (
            <>
              <PageItem key={rightDotsPageNumber} page={rightDotsPageNumber}>
                ...
              </PageItem>
              <PageItem key={pageNumber} page={pageNumber}>
                {pageNumber}
              </PageItem>
            </>
          );
        }

        return (
          <PageItem key={pageNumber} page={pageNumber}>
            {pageNumber}
          </PageItem>
        );
      })}
    </ul>
  );
};

const pageItemFacotry =
  (page: number, onClick?: (page: number) => void) =>
  (props: Omit<PageItemProps, "onClick" | "current">) => {
    return (
      <PageItem
        {...props}
        onClick={() => onClick?.(props.page)}
        current={page === props.page}
      />
    );
  };

type PageItemProps = {
  page: number;
  children: ReactNode;
  onClick?: (page: number) => void;
  current?: boolean;
};
const PageItem = ({
  page,
  children,
  onClick,
  current = false,
}: PageItemProps) => {
  return (
    <li
      className={clsx(
        "font-bold border-y-2 border-x px-2 py-1 transition-all",
        "first:rounded-tl-lg first:rounded-bl-lg first:border-l-2",
        "last:rounded-tr-lg last:rounded-br-lg last:border-r-2",
        {
          ["bg-blue-500 text-white border-blue-500"]: current,

          ["hover:bg-gray-200 cursor-pointer border-gray-300"]: !current,
        }
      )}
      key={page}
      onClick={() => onClick?.(page)}
    >
      {children}
    </li>
  );
};
