interface Props {
  page: number;
  totalPages: number;
}

export default function TablePagination({
  page,
  totalPages,
}: Props) {
  return (
    <div className="flex justify-end mt-8 gap-3">

      <button
        className="px-4 py-2 rounded-lg"
        style={{
          background: "#111827",
          color: "white",
        }}
      >
        Previous
      </button>

      <span className="text-white flex items-center">
        {page} / {totalPages}
      </span>

      <button
        className="px-4 py-2 rounded-lg"
        style={{
          background: "#F59E0B",
          color: "#111827",
        }}
      >
        Next
      </button>

    </div>
  );
}