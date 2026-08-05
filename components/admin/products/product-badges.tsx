interface Props {
  isFeatured: boolean;

  isTrending: boolean;
}

export default function ProductBadges({
  isFeatured,
  isTrending,
}: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {isFeatured && (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
          Featured
        </span>
      )}

      {isTrending && (
        <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">
          Trending
        </span>
      )}
    </div>
  );
}