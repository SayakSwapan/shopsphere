import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import ComboCheckoutClient from "@/components/store/combo-checkout/combo-checkout-client";

interface PageProps {
  searchParams: Promise<{ offer?: string }>;
}

export default async function ComboCheckoutPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login?redirectTo=/combo-checkout");
  }

  const { offer: slug } = await searchParams;
  if (!slug) {
    redirect("/combo-offers");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { addresses: true },
  });
  if (!user) {
    redirect("/login?redirectTo=/combo-checkout");
  }

  const addresses = user.addresses.map((a) => ({
    id: a.id,
    fullName: a.fullName,
    phone: a.phone,
    addressLine1: a.addressLine1,
    addressLine2: a.addressLine2,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    country: a.country,
    isDefault: a.isDefault,
  }));

  return (
    <div className="min-h-screen bg-bg-page">
      <NavbarWrapper />
      <ComboCheckoutClient addresses={addresses} offerSlug={slug} />
      <Footer />
    </div>
  );
}