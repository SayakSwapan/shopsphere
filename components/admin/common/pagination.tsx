interface Props {
  currentPage: number;

  totalPages: number;

  onPageChange: (
    page: number
  ) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: Props) {
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      {Array.from({
        length: totalPages,
      }).map((_, index) => {
        const page =
          index + 1;

        return (
          <button
            key={page}
            onClick={() =>
              onPageChange(page)
            }
            className={`px-4 py-2 rounded-lg border ${
              currentPage ===
              page
                ? "bg-black text-white"
                : ""
            }`}
          >
            {page}
          </button>
        );
      })}
    </div>
  );
}