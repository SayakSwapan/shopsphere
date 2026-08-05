import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";

import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import WishlistPageContent from "@/components/store/wishlist-page-content";

export default async function WishlistPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.user.id },
    include: {
      wishlistitem: {
        include: {
          product: {
            include: {
              productimage: true,
            },
          },
        },
      },
    },
  });

  const products =
    wishlist?.wishlistitem.map((item) => ({
      ...item.product,
      sellingPrice: Number(item.product.sellingPrice),
      salePrice: item.product.salePrice != null ? Number(item.product.salePrice) : undefined,
      finalPrice: item.product.finalPrice != null ? Number(item.product.finalPrice) : undefined,
      discountValue: item.product.discountValue != null ? Number(item.product.discountValue) : undefined,
      gstPercentage: item.product.gstPercentage != null ? Number(item.product.gstPercentage) : undefined,
    })) || [];

  return (
    <>
      <NavbarWrapper />

      <div className="min-h-screen bg-bg-page">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="mb-8 sm:mb-10">
            <div className="flex items-center gap-3 mb-2">
              <Heart size={28} className="text-primary" fill="currentColor" />
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-black text-text-heading tracking-tight"
                style={{ fontFamily: "var(--t-font-heading)" }}
              >
                My Wishlist
              </h1>
            </div>
            <p className="text-text-muted-1 text-sm sm:text-base">
              {products.length > 0
                ? `${products.length} saved product${products.length !== 1 ? "s" : ""}`
                : "Your saved products will appear here"}
            </p>
          </div>

          <WishlistPageContent initialProducts={products} />
        </div>
      </div>

      <Footer />
    </>
  );
}
