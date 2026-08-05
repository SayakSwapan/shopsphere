"use client";

interface Props {
  page: number;

  totalPages: number;

  onNext: () => void;

  onPrev: () => void;
}

export default function TablePagination({
  page,
  totalPages,
  onNext,
  onPrev,
}: Props) {
  return (
    <div className="flex items-center justify-between">

      <p className="text-sm text-slate-400">
        Page {page} of {totalPages}
      </p>

      <div className="flex gap-3">

        <button
          onClick={onPrev}
          disabled={page === 1}
          className="rounded-lg border border-slate-700 px-4 py-2 text-white"
        >
          Previous
        </button>

        <button
          onClick={onNext}
          disabled={
            page === totalPages
          }
          className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-black"
        >
          Next
        </button>

      </div>

    </div>
  );
}