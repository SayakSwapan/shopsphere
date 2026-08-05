"use client";

import { useEffect, useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/store/product-card";

interface Product {
  id: string;
  name: string;
  slug: string;
  sellingPrice: number;
  salePrice?: number;
  finalPrice?: number;
  discountType?: string;
  discountValue?: number;
  gstPercentage?: number;
  isFeatured: boolean;
  isTrending: boolean;
  productimage: {
    id: string;
    url: string;
  }[];
}

interface Props {
  initialProducts: Product[];
}

export default function WishlistPageContent({ initialProducts }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  async function refreshWishlist() {
    try {
      const response = await fetch("/api/wishlist/list", {
        cache: "no-store",
      });
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    const refresh = () => {
      refreshWishlist();
    };

    window.addEventListener("wishlist-page-refresh", refresh);

    return () => {
      window.removeEventListener("wishlist-page-refresh", refresh);
    };
  }, []);

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 sm:py-28">
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mb-6 border border-border-card bg-bg-card-nested"
          style={{ borderRadius: "var(--t-radius-card)" }}
        >
          <Heart size={36} className="text-text-muted-2" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-text-heading mb-2">
          Your Wishlist is Empty
        </h2>
        <p className="text-text-muted-1 text-sm sm:text-base mb-8 text-center max-w-md">
          Browse our collection and save your favorite items for later.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all duration-300 bg-primary hover:opacity-90"
          style={{ borderRadius: "var(--t-radius-button)", color: "var(--t-bg-page)", fontFamily: "var(--t-font-heading)" }}
        >
          <ShoppingCart size={16} />
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
