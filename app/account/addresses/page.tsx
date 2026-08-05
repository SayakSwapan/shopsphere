import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import Link from "next/link";

export default function AddressPage() {
  return (
    <div className="bg-bg-page min-h-screen">

      <NavbarWrapper />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-text-heading">
            My Addresses
          </h1>

          <Link
            href="/account/addresses/new"
            className="
            bg-primary
            text-bg-page
            px-6
            py-4
            font-black
            uppercase
            "
            style={{ fontFamily: "var(--t-font-heading)", borderRadius: "var(--t-radius-button)" }}
          >
            Add Address
          </Link>

        </div>

      </div>

      <Footer />

    </div>
  );
}